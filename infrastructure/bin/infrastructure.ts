#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {InfrastructureStack1} from '../lib/infrastructure-stack1';
import {InfrastructureStack2} from '../lib/infrastructure-stack2';
import {InfrastructureStack6} from '../lib/infrastructure-stack6';

const app = new cdk.App();
new InfrastructureStack1(app, 'GraphQLWorkshopStack1');
new InfrastructureStack2(app, 'GraphQLWorkshopStack2');
new InfrastructureStack6(app, 'GraphQLWorkshopStack6');
