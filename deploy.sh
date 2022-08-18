#!/usr/bin/env bash
set -euo pipefail

# Deploys the blockchain api to App Engine
#
# Flags:
# -n: Name of the network, maps to App Engine 'service' (alfajores, mainnet, etc.)

NETWORK=""

while getopts 'n:p:k:s:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    k) SENTRY_KEY="$OPTARG" ;;
    s) SEMVER="$OPTARG" ;;
    *) echo "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

function sentry_release () {
  # Setup configuration values
  SENTRY_AUTH_TOKEN=$SENTRY_KEY
  SENTRY_ORG=zed-labs
  SENTRY_PROJECT=kolektivo-blockchain-api
  VERSION=`sentry-cli releases $SEMVER`
  # Workflow to create releases
  sentry-cli releases new "$VERSION"
  sentry-cli releases set-commits "$VERSION" --auto
  sentry-cli releases finalize "$VERSION"
}

PROJECT="kolektivo-backend"

echo "Starting blockchain api deployment."

echo 'Deploying to gcloud'
gcloud --project ${PROJECT} app deploy -q "app.${NETWORK}.yaml"
gcloud --project ${PROJECT} app deploy -q cron.yaml

[ -z "$SENTRY_KEY" ] && echo "Sentry key not set, skipping sentry release" && exit 0;
[ -z "$SEMVER" ] && echo "Version not set, skipping sentry release" && exit 0;

sentry_release

echo 'Hitting service url to trigger update'
# This seems to be necessary to ensure get App Engine starts the service
curl "https://${NETWORK}-blockchain-api.kolektivo-backend.uc.r.appspot.com" > /dev/null 2>&1

echo "Done deployment."
