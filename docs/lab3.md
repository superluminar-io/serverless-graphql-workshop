# Lab 3 - Monitoring + Alerting

## In this lab …

* Check out basic metrics provided by AWS
* Create Alarms based on these metrics
* Learn how notifications work

## Overview

- Why monitoring and alerting?
- What to monitor?
- Notifications

## Monitoring + Alerting

When using serverless components from AWS you leave big part of the heavy lifting to Amazon. 
This gives you the freedom of not having to worry about monitoring any servers anymore. 

Nonetheless, there are still things that could go wrong:

- You can deploy code that only errors under certain circumstances, not covered by your integration tests.
- You can hit the memory limit of your function.
- Your function can get throttled, because there is not enough reserved concurrency left.

## What to monitor?

Most AWS services generates some useful metrics on their own. AppSync is a bit weak in this regard, but let's take a look:

1. Go to the [Cloudwatch console](https://console.aws.amazon.com/cloudwatch)
1. In the navigation click in **Metrics**
1. Select the metrics for **AppSync** and the filter **API Metrics**
1. Here we can see a list of all available metrics for all your APIs 
(check out [the docs](https://docs.aws.amazon.com/appsync/latest/devguide/monitoring.html) for details)


Now we are going to create an alarm. It should be triggered if the latency of our API get bad.

1. Select the **Latency** metric for out API
1. Click on the **Graphed metrics** tab
1. Find the little bell icon 🔔 on right side and click it to create an alarm from this metric
1. Use the **Average** statistic and set the **Period** to 5 minute
1. Configure your alarm to get triggered when the latency is above 500ms
1. Click on **Next** 
1. Configure a SNS Topic to receive email notifications for the alarm (do not forget to click the confirmation link in the email!)
1. Click on **Next**
1. Name the alarm and click on **Create alarm**

You can now:

- introduce latency into your pipeline (e.g. by letting the **hasBadEmojis** function sleep for 500ms) 
- create a comment
- see if the alarm goes off

## Notifications

We created an SNS topic earlier to receive notification for our latency alarm. 
Let's have a look, what was created in background.

1. Go to the [SNS console](https://console.aws.amazon.com/sns/)
1. Find the topic you create earlier and click on the name
1. Go to subscription and check the subscription status for your email address

