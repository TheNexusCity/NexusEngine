#!/bin/bash
set -e
set -x

STAGE=$1
TAG=$2
LABEL=$3
PRIVATE_ECR=$4
REGION=$5

if [ $PRIVATE_ECR == "true" ]
then
  aws ecr get-login-password --region $REGION | docker login -u AWS --password-stdin $ECR_URL
  node ./scripts/prune_ecr_images.js --repoName $REPO_NAME-builder --region $REGION --public false
else
  aws ecr-public get-login-password --region us-east-1 | docker login -u AWS --password-stdin $ECR_URL
  node ./scripts/prune_ecr_images.js --repoName $REPO_NAME-builder --region us-east-1 --public true
fi

docker tag $LABEL $ECR_URL/$REPO_NAME-builder:$TAG
docker tag $LABEL $ECR_URL/$REPO_NAME-builder:latest_$STAGE
docker push $ECR_URL/$REPO_NAME-builder:$TAG
docker push $ECR_URL/$REPO_NAME-builder:latest_$STAGE
