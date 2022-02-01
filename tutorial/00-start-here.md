# Why are we building XREngine?

We chose to build a free, open, full-stack MMO engine that anyone could run for any reason - to host events, make games, show art, or just to give a space for your community. There are plenty of platforms you can spend a bit of money on to have a world, but you can't be in complete control of the experience or customise it from the ground up.

When the XREngine stack is deployed, that stack is sovereign, open and cross platform by default. Users can make any kind of game or experience with no limits. And with the tech we're building now, users will be able to seamlessly travel through portals from my worlds to yours, on different servers, and have all their inventory and identity travel with them.

This technology is for everyone, but especially people who want to build or belong to a community.

# Table of Contents
- [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Packages Overview](#packages-overview)
  - [Projects API](#projects-api)
  - [The Editor, Scenes and Locations](#the-editor-scenes-and-locations)
  - [Entity Component System Architecture](#entity-component-system-architecture)
  - [Hookstate](#hookstate)
  - [Feathers & Sequelize](#feathers--sequelize)
  - [Kubernetes, Agones & Helm](#kubernetes-agones--helm)
  - [Minikube](#minikube)
  - [Deployment to AWS](#deployment-to-aws)
  - [API Docs](#api-docs)


## [Installation](./01-installation.md)
Getting started with installing the stack and running the engine
## [Architecture Overview](./02-architecture-overview.md)
A high level overview of the architecture and the packages that form the XREngine stack
## [Projects API](./03-projects-api.md)
How to use the engine to manage custom code, assets and scenes
## [The Editor, Scenes and Locations](./04-editor-scenes-locations.md)
Create scenes and launch them with locations
## [Entity Component System Architecture](./05-ecs.md)
The ECS is what enables the engine to run as fast as it does and will soon support hundreds of cuncurrent users
## [Hookstate](./06-hookstate.md)
Fully typed and clear state management using the FLUX pattern
## [Feathers & Sequelize](./07-feathers-sequelize.md)
MYSQL and full stack service api
## [Kubernetes, Agones & Helm](./08-K8s-agones-helm.md)
Highly scalable game infrastructure using docker
## [Minikube](./09-minikube.md)
Run a cluster on your machine
## [Deployment to AWS](./10-deployment.md)
Get your worlds out into the web!
## [API Docs](https://xrfoundation.github.io/xrengine-docs/docs/)
Our API reference is auto-generated from the tsdoc comments in the codebase
