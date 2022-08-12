# Blockchain API Service

## Setup

Install dependencies:

```console
yarn
```

Build (must run first or tests will not pass!):

```console
yarn build
```

## Testing

Unit tests, linting, and formatting:

```console
yarn test
```

End-to-end tests:

```console
yarn e2e
```

## Running locally

You can run with the [Firebase emulator](#emulator) or a real
[Firebase account](#account). Copy the corresponding example config
file.

For the emulator:

```console
# Check if there are any values you need to complete
cp emulator.env .env
```

or for the account:

```console
# Check if there are any values you need to complete
cp example.env .env
```

We use Docker for the postgres database, steps to set this up are in the
[relevant section](#docker-compose). A few more environment variables are needed to reference this local database, for example

```console
BLOCKCHAIN_DB_HOST=localhost
BLOCKCHAIN_DB_DATABASE=postgres # depending on what is inside the docker container
BLOCKCHAIN_DB_USER=postgres
BLOCKCHAIN_DB_PASS=pass # declared in the docker-compose.yml
```

After completing your `.env` and starting the database, we can finally start the
blockchain-api:

```console
yarn start:dev  # Uses tsc-watch to watch the folder and rebuild as needed
```

### Docker Compose

Docker offers us a way to simply set up our local environment, so we can run the service with a implementation for every external dependency.
The `docker-compose.yml` contains all the configuration.
To run it, install docker from: https://docs.docker.com/desktop/mac/install/
Then, you should be able to run `docker-compose up` in the root of the repo and it will set up all the dependencies.

To see active docker containers, you can run `docker ps`

To enter in a container, you can run `docker exec -it ${CONTAINER_ID} /bin/bash`

#### Postgres

If you want to take a look at postgres db, access to the container with the command of above, and then `psql -U postgres`

## Firebase

### Emulator

Start the emulator before running blockchain-api:

```console
yarn firebase:emulate
```

### Account

You also need a service account for the Firebase connection. You can create one from the GCP IAM console following these steps (ignore all except the last one if you already have one):

- Open the GCP console.
- Go to `IAM & Admin`
- Choose `Service Accounts` from the side menu
- Pick a name such as `Development Service Account for FirstName LastName` and press `Continue`
- Assign the role `Firebase Admin`
- Press `Done`
- Search for the newly created service account in the list and press on its 'email' column to open it.
- Go to the `Keys` tab.
- `Add key` -> `Create new key` -> `JSON` -> `Create`
- You will be prompted to download the service account key. Rename it to `serviceAccountKey.json` and put it in the root of the repo.

## Deployments

Changes that are merged to the main branch are automatically deployed to
Alfajores and Mainnet.
