# Serverless GraphQL API with AppSync and DynamoDB

## What are we going to build?

In this workshop, we are going to build a simple GraphQL API for a blog. The API provides mutations to create new articles and comments plus a query to retrieve specific articles and the comments attached to them. From a technical standpoint, we are going to use [AppSync](https://aws.amazon.com/appsync/) in combination with [Lambda](https://aws.amazon.com/lambda/) and [DynamoDB](https://aws.amazon.com/dynamodb/).

![Architecture](/_media/welcome/architecture.png)

* Lambda function for input validation
* Two databases to store **articles** and **comments**
* [VTL](https://docs.aws.amazon.com/appsync/latest/devguide/resolver-mapping-template-reference.html) for resolvers to keep it as functionless as possible

## What will you learn?

* Setting up AppSync with DynamoDB and VTL
* Wiring up different databases with GraphQL
* Using pipeline resolvers for validation
* Monitoring the API
* X-Ray to trace requests
* Caching with AppSync
* Pagination with GraphQL and DynamoDB

## Prerequisites

To get started with the workshop you need to have Administrator Access to an AWS Account. Please do not use the accounts root user since this is bad practice and leads to potential security risks.

We recommend you create a dedicated IAM user following [this guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started_create-admin-group.html). Make sure, that you are able to login into the [AWS Console](https://console.aws.amazon.com/) with your IAM user.

## Out of Scope

* Testing
* Continuous Integration
* Continuous Deployment 
* Infrastructure as Code
* Authentication / Authorization
