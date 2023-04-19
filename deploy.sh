#!/usr/bin/env bash
set -euo pipefail

# Deploys the blockchain api to App Engine
#
# Flags:
# -n: Name of the network, maps to App Engine 'service' (alfajores, mainnet, etc.)

NETWORK=""

while getopts 'n:p:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    *) echo "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

PROJECT="kolektivo-backend"

echo "Starting blockchain api deployment."

echo 'Deploying to gcloud'

gcloud --project ${PROJECT} app deploy -q "app.${NETWORK}.yaml"
gcloud --project ${PROJECT} app deploy -q dispatch.yaml
gcloud --project ${PROJECT} app deploy -q cron.yaml

echo 'Hitting service url to trigger update'

if [ "$NETWORK" == "mainnet" ] then
  curl "https://${PROJECT}.uc.r.appspot.com" > /dev/null 2>&1
else
  curl "https://${NETWORK}-dot-${PROJECT}.uc.r.appspot.com" > /dev/null 2>&1

echo "Done deployment."
