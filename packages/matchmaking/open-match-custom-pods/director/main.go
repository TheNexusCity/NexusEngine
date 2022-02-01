// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"fmt"
	"github.com/golang/protobuf/ptypes"
	"github.com/golang/protobuf/ptypes/any"
	"github.com/golang/protobuf/ptypes/wrappers"
	"io"
	"lagunalabs/matchmaking/common"
	"log"
	//"math/rand"
	"net/http"
    "os"
    "strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/kelseyhightower/envconfig"
	"github.com/heptiolabs/healthcheck"
	"google.golang.org/grpc"
	"open-match.dev/open-match/pkg/pb"
)

// The Director in this tutorial continously polls Open Match for the Match
// Profiles and makes random assignments for the Tickets in the returned matches.

const (
	// The endpoint for the Open Match Backend service.
	omBackendEndpoint = "open-match-backend.open-match.svc.cluster.local:50505"
	// The Host and Port for the Match Function service endpoint.
)

func runReadiness() {
    health := healthcheck.NewHandler()
    health.AddLivenessCheck("goroutine-threshold", healthcheck.GoroutineCountCheck(100))
    health.AddReadinessCheck("goroutine-threshold", healthcheck.GoroutineCountCheck(100))
    go http.ListenAndServe("0.0.0.0:8086", health)
}

func main() {
	functionHostName := fmt.Sprintf("%s.%s", os.Getenv("RELEASE_FULLNAME"), os.Getenv("NAMESPACE"))
	intPort, portErr := strconv.Atoi(os.Getenv("MATCHFUNCTION_PORT"))
	if portErr != nil {
	    log.Fatalf(portErr.Error())
	}
	functionPort := int32(intPort)
	log.Printf("Use backend host:[%s]", omBackendEndpoint)
	log.Printf("functionHostName %s", functionHostName)
	log.Printf("functionPort %s", functionPort)

	var envConfig common.EnvDataSpecification
	err := envconfig.Process("MATCHMAKING", &envConfig)
	if err != nil {
		log.Fatal(err.Error())
	}

	fmt.Println("GameTypes:")
	for _, v := range envConfig.GameTypes {
		fmt.Printf("  %s\n", v)
	}

	fmt.Println("GameTypesSizes:")
	for k, v := range envConfig.GameTypesSizes {
		fmt.Printf("  %s: %d\n", k, v)
	}

	// Connect to Open Match Backend.
	conn, err := grpc.Dial(omBackendEndpoint, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("Failed to connect to Open Match Backend, got %s", err.Error())
	}

	runReadiness()

	defer conn.Close()
	be := pb.NewBackendServiceClient(conn)

	// Generate the profiles to fetch matches for.
	// modes := []string{"mode.demo", "mode.ctf", "mode.battleroyale"}
	profiles := generateProfiles(envConfig.GameTypes, envConfig.GameTypesSizes)
	log.Printf("Fetching matches for %v profiles", len(profiles))

	for range time.Tick(time.Second * 5) {
		// Fetch matches for each profile and make random assignments for Tickets in
		// the matches returned.
		var wg sync.WaitGroup
		for _, p := range profiles {
			wg.Add(1)
			go func(wg *sync.WaitGroup, p *pb.MatchProfile) {
				defer wg.Done()
				matches, err := fetch(be, p, functionHostName, functionPort)
				if err != nil {
					log.Printf("Failed to fetch matches for profile %v, got %s", p.GetName(), err.Error())
					return
				}

                if len(matches) > 0 {
                    log.Printf("Generated %v matches for profile %v", len(matches), p.GetName())
                    if err := assign(be, p, matches); err != nil {
                        log.Printf("Failed to assign servers to matches, got %s", err.Error())
                        return
                    }
                    log.Printf("Assigned")
				}
			}(&wg, p)
		}

		wg.Wait()
	}
}

func fetch(be pb.BackendServiceClient, p *pb.MatchProfile, functionHostName string, functionPort int32) ([]*pb.Match, error) {
	req := &pb.FetchMatchesRequest{
		Config: &pb.FunctionConfig{
			Host: functionHostName,
			Port: functionPort,
			Type: pb.FunctionConfig_GRPC,
		},
		Profile: p,
	}

	stream, err := be.FetchMatches(context.Background(), req)
	if err != nil {
		log.Println()
		return nil, err
	}

	var result []*pb.Match
	for {
		resp, err := stream.Recv()
		if err == io.EOF {
			break
		}

		if err != nil {
			return nil, err
		}

		result = append(result, resp.GetMatch())
	}

	return result, nil
}

func assign(be pb.BackendServiceClient, p *pb.MatchProfile, matches []*pb.Match) error {
	for _, match := range matches {
		ticketIDs := []string{}
		for _, t := range match.GetTickets() {
			ticketIDs = append(ticketIDs, t.Id)
		}

		var gameMode = ""
		if p.Extensions != nil {
			if message, ok := p.Extensions["profileData"]; ok {
				m := new(common.ProfileDataMessage)
				if message.MessageIs(m) {
					if err := message.UnmarshalTo(m); err != nil {
						log.Printf("failed to extract profileData")
					} else {
						gameMode = m.Mode
					}
				}
			}
		}

		// wrappedGameMode, err := any.Marshal(&wrappers.StringValue{Value: gameMode})
		wrappedGameMode, err := ptypes.MarshalAny(&wrappers.StringValue{
			Value: gameMode,
		})
		if err != nil {
			// handle marshaling error.
			log.Printf("failed to marshal gamemode")
		}

		// TODO get gameserver ip or link
		conn := uuid.New().String()
		// conn := fmt.Sprintf("%d.%d.%d.%d:2222", rand.Intn(256), rand.Intn(256), rand.Intn(256), rand.Intn(256))
		req := &pb.AssignTicketsRequest{
			Assignments: []*pb.AssignmentGroup{
				{
					TicketIds: ticketIDs,
					Assignment: &pb.Assignment{
						Connection: conn,
						Extensions: map[string]*any.Any{
							"GameMode": wrappedGameMode,
						},
					},
				},
			},
		}

		if _, err := be.AssignTickets(context.Background(), req); err != nil {
			return fmt.Errorf("AssignTickets failed for match %v, got %w", match.GetMatchId(), err)
		}

		log.Printf("Assigned server %v to match %v", conn, match.GetMatchId())
		log.Printf("Tickets:")
		for _, t := range ticketIDs {
			log.Printf(t)
		}
	}

	return nil
}
