# Infrastructure

In this directory the infrastructure code is provided for some of the steps of the workshop.
It's using [CDK](https://aws.amazon.com/cdk/) to describe the infrastructure.

## Get started

Run the following command:
```
cdk deploy GraphQLWorkshopStack1
```
Repeat the command for the other stacks provided in [bin/infrastructure.ts](bin/infrastructure.ts).

If you haven't used CDK before, you might need to run `cdk bootstrap` before.

### Note

The separate stacks are built accordingly to the steps in the workshop.
This means, the resources in stack 1 might have minor changes in stack 2.
So take care when investigating the stack resources.

Also, the stack is not 'beautified' into CDK constructs or other things.
Each stack simply lists all resources in one file which can be very confusing.
But in order to understand how the stack works, it's probably easier to understand when getting started with GraphQL (and CDK). 

## Development

For further development on the infrastructure code, the following commands might be helpful:

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
