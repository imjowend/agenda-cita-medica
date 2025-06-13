import type { AWS } from '@serverless/typescript';

const stage = '${opt:stage, "dev"}'; // Define stage as a variable

const serverlessConfiguration: AWS = {
  service: 'appointment-service',
  frameworkVersion: '3',
  useDotenv: true,
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'us-east-1',
    stage: stage, // Use the defined stage variable here
    environment: {
      STAGE: stage, // Add STAGE to environment variables
      DYNAMO_DATE_TABLE: '${self:service}-date-${opt:stage, "dev"}',
      DYNAMO_SCHEDULE_DATE_TABLE: '${self:service}-schedule-date-${opt:stage, "dev"}',
      // RDS PE
      DB1_HOST: '${env:DB1_HOST}',
      DB1_PORT: '${env:DB1_PORT}',
      DB1_NAME: '${env:DB1_NAME}',
      DB1_USER: '${env:DB1_USER}',
      DB1_PASS: '${env:DB1_PASS}',

      // RDS CL
      DB2_HOST: '${env:DB2_HOST}',
      DB2_PORT: '${env:DB2_PORT}',
      DB2_NAME: '${env:DB2_NAME}',
      DB2_USER: '${env:DB2_USER}',
      DB2_PASS: '${env:DB2_PASS}',
      APPOINTMENT_TOPIC_ARN: { Ref: 'AppointmentTopic' },
      APPOINTMENT_STATUS_QUEUE_URL: { Ref: 'AppointmentStatusQueue' },
      APPOINTMENT_QUEUE_PE_URL: { Ref: 'AppointmentQueuePE' },
      APPOINTMENT_QUEUE_CL_URL: { Ref: 'AppointmentQueueCL' },
      EVENT_BUS_NAME: { Ref: 'AppointmentEventBus' }
    },
    logRetentionInDays: 14,
    tracing: {
      lambda: true,
      apiGateway: true
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['dynamodb:Query', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
        Resource: [
          { 'Fn::GetAtt': ['DateTable', 'Arn'] },
          { 'Fn::GetAtt': ['ScheduleDateTable', 'Arn'] }
        ]
      },
      {
        Effect: 'Allow',
        Action: ['sns:Publish'],
        Resource: { Ref: 'AppointmentTopic' }
      },
      {
        Effect: 'Allow',
        Action: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        Resource: [
          { 'Fn::GetAtt': ['AppointmentStatusQueue', 'Arn'] },
          { 'Fn::GetAtt': ['AppointmentQueuePE', 'Arn'] },
          { 'Fn::GetAtt': ['AppointmentQueueCL', 'Arn'] }
        ]
      },
      {
        Effect: 'Allow',
        Action: ['events:PutEvents'],
        Resource: { 'Fn::GetAtt': ['AppointmentEventBus', 'Arn'] }
      },
      {
        Effect: 'Allow',
        Action: [
          'rds-db:connect'
        ],
        Resource: [
          'arn:aws:rds:${self:provider.region}:*:db:*'
        ]
      }
    ],
    vpc: {
      securityGroupIds: ['sg-0d21de2e32ff7aea9'],
      subnetIds: ['subnet-02d024213a9dda86a', 'subnet-01089ef447d3c467f', 'subnet-05d6b05cb473ed93c', 'subnet-052db12ebd477e2b9', 'subnet-00b189709e7ac783f', 'subnet-0300074f5688d9003']
    }

  },
  functions: {
    appointment: {
      handler: 'src/appointment/handler.httpHandler',
      timeout: 30,
      memorySize: 512,
      events: [
        {
          http: {
            method: 'post',
            path: 'appointment',
            cors: true
          }
        },
        {
          http: {
            method: 'get',
            path: 'appointment/{insuredId}',
            cors: true
          }
        }
      ]
    },
    appointmentProcessor: {
      handler: 'src/appointment/handler.sqsHandler',
      timeout: 30,
      memorySize: 512,
      events: [
        {
          sqs: {
            arn: { 'Fn::GetAtt': ['AppointmentStatusQueue', 'Arn'] },
            batchSize: 1
          }
        }
      ]
    },
    appointmentPE: {
      handler: 'src/appointment_pe/handler.sqsHandler',
      timeout: 30,
      memorySize: 512,
      events: [
        {
          sqs: {
            arn: { 'Fn::GetAtt': ['AppointmentQueuePE', 'Arn'] },
            batchSize: 1
          }
        }
      ]
    },
    appointmentCL: {
      handler: 'src/appointment_cl/handler.sqsHandler',
      timeout: 30,
      memorySize: 512,
      events: [
        {
          sqs: {
            arn: { 'Fn::GetAtt': ['AppointmentQueueCL', 'Arn'] },
            batchSize: 1
          }
        }
      ]
    }
  },
  resources: {
    Resources: {
      DateTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:service}-date-${opt:stage, "dev"}',
          AttributeDefinitions: [
            { AttributeName: 'insuredId', AttributeType: 'S' }
          ],
          KeySchema: [
            { AttributeName: 'insuredId', KeyType: 'HASH' }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }
      },
      ScheduleDateTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:service}-schedule-date-${opt:stage, "dev"}', // Changed here
          AttributeDefinitions: [
            { AttributeName: 'scheduleId', AttributeType: 'N' },
            { AttributeName: 'centerId', AttributeType: 'S' },
            { AttributeName: 'medicId', AttributeType: 'S' }
          ],
          KeySchema: [
            { AttributeName: 'scheduleId', KeyType: 'HASH' }
          ],
          BillingMode: 'PAY_PER_REQUEST',
          GlobalSecondaryIndexes: [
            {
              IndexName: 'centerId-index',
              KeySchema: [
                { AttributeName: 'centerId', KeyType: 'HASH' },
                { AttributeName: 'scheduleId', KeyType: 'RANGE' }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            },
            {
              IndexName: 'medicId-index',
              KeySchema: [
                { AttributeName: 'medicId', KeyType: 'HASH' },
                { AttributeName: 'scheduleId', KeyType: 'RANGE' }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            }
          ]
        }
      },
      // Event Bus
      AppointmentEventBus: {
        Type: 'AWS::Events::EventBus',
        Properties: {
          Name: '${self:service}-bus-${opt:stage, "dev"}' // Changed here
        }
      },

      // SNS Topic
      AppointmentTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          TopicName: '${self:service}-topic-${opt:stage, "dev"}' // Changed here
        }
      },

      // SQS Queues
      AppointmentQueuePE: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-pe-${opt:stage, "dev"}', // Changed here
          VisibilityTimeout: 60,
          MessageRetentionPeriod: 1209600,
          RedrivePolicy: {
            deadLetterTargetArn: { 'Fn::GetAtt': ['AppointmentQueuePEDLQ', 'Arn'] },
            maxReceiveCount: 3
          }
        }
      },

      AppointmentQueuePEDLQ: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-pe-dlq-${opt:stage, "dev"}' // Changed here
        }
      },

      AppointmentQueueCL: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-cl-${opt:stage, "dev"}', // Changed here
          VisibilityTimeout: 60,
          MessageRetentionPeriod: 1209600,
          RedrivePolicy: {
            deadLetterTargetArn: { 'Fn::GetAtt': ['AppointmentQueueCLDLQ', 'Arn'] },
            maxReceiveCount: 3
          }
        }
      },

      AppointmentQueueCLDLQ: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-cl-dlq-${opt:stage, "dev"}' // Changed here
        }
      },

      AppointmentStatusQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-status-${opt:stage, "dev"}', // Changed here
          VisibilityTimeout: 60,
          MessageRetentionPeriod: 1209600,
          RedrivePolicy: {
            deadLetterTargetArn: { 'Fn::GetAtt': ['AppointmentStatusQueueDLQ', 'Arn'] },
            maxReceiveCount: 3
          }
        }
      },

      AppointmentStatusQueueDLQ: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-status-dlq-${opt:stage, "dev"}' // Changed here
        }
      },

      // SNS Subscriptions
      AppointmentQueuePESubscription: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          TopicArn: { Ref: 'AppointmentTopic' },
          Protocol: 'sqs',
          Endpoint: { 'Fn::GetAtt': ['AppointmentQueuePE', 'Arn'] },
          FilterPolicy: {
            countryISO: ['PE']
          }
        }
      },

      AppointmentQueueCLSubscription: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          TopicArn: { Ref: 'AppointmentTopic' },
          Protocol: 'sqs',
          Endpoint: { 'Fn::GetAtt': ['AppointmentQueueCL', 'Arn'] },
          FilterPolicy: {
            countryISO: ['CL']
          }
        }
      },

      // EventBridge Rules
      AppointmentEventRule: {
        Type: 'AWS::Events::Rule',
        Properties: {
          Name: '${self:service}-confirmation-${opt:stage, "dev"}', // Changed here
          EventBusName: { Ref: 'AppointmentEventBus' },
          EventPattern: {
            source: ['appointment-service'],
            'detail-type': ['appointment.confirmed']
          },
          State: 'ENABLED',
          Targets: [{
            Arn: { 'Fn::GetAtt': ['AppointmentStatusQueue', 'Arn'] },
            Id: 'UpdateAppointmentStatus'
          }]
        }
      },

      // EventBridge Policy
      AppointmentEventBridgePolicy: {
        Type: 'AWS::Events::EventBusPolicy',
        Properties: {
          EventBusName: { Ref: 'AppointmentEventBus' },
          StatementId: 'AllowEventBridgeInvoke',
          Action: 'events:PutEvents',
          Principal: '*'
        }
      },

      // Queue Policies
      AppointmentQueuePEPolicy: {
        Type: 'AWS::SQS::QueuePolicy',
        Properties: {
          Queues: [{ Ref: 'AppointmentQueuePE' }],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: '*',
              Action: 'sqs:SendMessage',
              Resource: { 'Fn::GetAtt': ['AppointmentQueuePE', 'Arn'] },
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': { Ref: 'AppointmentTopic' }
                }
              }
            }]
          }
        }
      },

      AppointmentQueueCLPolicy: {
        Type: 'AWS::SQS::QueuePolicy',
        Properties: {
          Queues: [{ Ref: 'AppointmentQueueCL' }],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: '*',
              Action: 'sqs:SendMessage',
              Resource: { 'Fn::GetAtt': ['AppointmentQueueCL', 'Arn'] },
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': { Ref: 'AppointmentTopic' }
                }
              }
            }]
          }
        }
      }
    }
  },
  custom: {
    xrayTracingEnabled: true,
    tags: {
      Environment: '${opt:stage, "dev"}', // Changed here
      Project: '${self:service}',
      Owner: 'appointment-team'
    }
  }
};

module.exports = serverlessConfiguration;