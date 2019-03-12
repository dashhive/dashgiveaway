# dashgiveaway

dashgiveaway.com

## dev build

* `yarn`
* `yarn start`
* have your editor run prettier on save


## Development Hosting and Deployment

This project is hosted on firebase using the firebase CLI

### Setup
#### Firebase
* Log in to [firebase](https://console.firebase.google.com/u/0/) or create a new account
* Create a new project titled which will correspond to this website

#### Local
* Install the firebase CLI using `npm i -g firebase-tools`
* Log in to the firebase CLI by running `firebase login` and following the prompts
* Connect the local project to the firebase project using `firebase use --add`
    * This will open a list of projects, select the newly created project
* Specify an alias for the deployment target (staging is provided as an example)

#### Deployment
Simply run `firebase deploy` to deploy to your specific firebase target

## Production Hosting and Deployment
There is not currently a method for deploying to the production environment.
A unique production login needs to be created with the `dashgiveaway.com` domain setup.