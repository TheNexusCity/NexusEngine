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

package mmf

import (
	"fmt"
	"github.com/golang/protobuf/ptypes"
	"github.com/golang/protobuf/ptypes/any"
	"lagunalabs/matchmaking/common"
	"log"
	//"math/rand"
	"time"

	"open-match.dev/open-match/pkg/matchfunction"
	"open-match.dev/open-match/pkg/pb"
)

const (
	matchName              = "basic-matchfunction"
)

// Run is this match function's implementation of the gRPC call defined in api/matchfunction.proto.
func (s *MatchFunctionService) Run(req *pb.RunRequest, stream pb.MatchFunction_RunServer) error {
	poolTickets, err := matchfunction.QueryPools(stream.Context(), s.queryServiceClient, req.GetProfile().GetPools())
	if err != nil {
		log.Printf("Failed to query tickets for the given pools, got %s", err.Error())
		return err
	}
	if len(poolTickets) == 0 {
	    return nil
	}
	log.Printf("Processing %v tickets for profile %v", len(poolTickets), req.GetProfile().GetName())

	// Generate proposals.
	proposals, err := makeMatches(req.GetProfile(), poolTickets)
	if err != nil {
		log.Printf("Failed to generate matches, got %s", err.Error())
		return err
	}

	log.Printf("Streaming %v proposals to Open Match", len(proposals))
	// Stream the generated proposals back to Open Match.
	for _, proposal := range proposals {
		if err := stream.Send(&pb.RunResponse{Proposal: proposal}); err != nil {
			log.Printf("Failed to stream proposals to Open Match, got %s", err.Error())
			return err
		}
	}

	return nil
}

func makeMatches(p *pb.MatchProfile, poolTickets map[string][]*pb.Ticket) ([]*pb.Match, error) {
	var ticketsPerPoolPerMatch = 16
	if p.Extensions != nil {
		if message, ok := p.Extensions["profileData"]; ok {
			m := new(common.ProfileDataMessage)
			if message.MessageIs(m) {
				if err := message.UnmarshalTo(m); err != nil {
					log.Printf("failed to extract profileData")
				} else {
					ticketsPerPoolPerMatch = int(m.TeamSize)
				}
			}
		}
	}
	log.Printf("TeamSize %v", ticketsPerPoolPerMatch)

	var matches []*pb.Match
	count := 0
	for {
		insufficientTickets := false
		matchTickets := []*pb.Ticket{}
		for pool, tickets := range poolTickets {
			log.Printf("Checking: pool %s have %v tickets of %v needed", pool, len(tickets), ticketsPerPoolPerMatch)
			if len(tickets) < ticketsPerPoolPerMatch {
				// This pool is completely drained out. Stop creating matches.
				insufficientTickets = true
				break
			}

			// Remove the Tickets from this pool and add to the match proposal.
			matchTickets = append(matchTickets, tickets[0:ticketsPerPoolPerMatch]...)
			poolTickets[pool] = tickets[ticketsPerPoolPerMatch:]
		}

		if insufficientTickets {
			break
		}

		matchScore := scoreCalculator(matchTickets)
		log.Printf("Score for the generated match is %v", matchScore)

		evaluationInput, err := ptypes.MarshalAny(&pb.DefaultEvaluationCriteria{
			Score: matchScore,
		})
		if err != nil {
			log.Printf("Failed to marshal DefaultEvaluationCriteria, got %w.", err)
			return nil, fmt.Errorf("Failed to marshal DefaultEvaluationCriteria, got %w", err)
		}

		matches = append(matches, &pb.Match{
			MatchId:       fmt.Sprintf("profile-%v-time-%v-%v", p.GetName(), time.Now().Format("2006-01-02T15:04:05.00"), count),
			MatchProfile:  p.GetName(),
			MatchFunction: matchName,
			Tickets:       matchTickets,
			Extensions: map[string]*any.Any{
				"evaluation_input": evaluationInput,
			},
		})

		count++
	}

	return matches, nil
}

func scoreCalculator(tickets []*pb.Ticket) float64 {
	matchScore := .0
	// TODO: Add your logic to compute the score for this Match here


	// This match function defines the quality of a match as the sum of the wait time
	// of all the tickets in this match. When deduplicating overlapping matches, the
	// evaluator will pick the match with the higher the score, thus picking the one
	// with longer aggregate player wait times.

	now := float64(time.Now().UnixNano())
	for _, ticket := range tickets {
		waitTime := now - ticket.GetSearchFields().GetDoubleArgs()["time.enterqueue"]
		matchScore += waitTime
	}

	return matchScore
}
