'use strict';

const AWS = require('aws-sdk');

/**
 * @param region optional AWS region
 * @param profile optional AWS profile
 **/
const AWSClient = function(region, profile) {
    if (region) {
        AWS.config.region = region;
    }
    // you should using standard AWS environement variable to configure this.
    if (profile) {
        AWS.config.credentials = new AWS.SharedIniFileCredentials({
            profile: profile
        });
    }
    this.aws = AWS;
    this.cloudformation = new AWS.CloudFormation();
    this.dynamodbstreams = new AWS.DynamoDBStreams();
}

module.exports = AWSClient;


/**
 * Normalize name:
 *  - white space, and dot will be processed as '-' separator.
 *  - each '-' will be removed, and view as a single word to capitalize
 * @param name a name
 * @return name string without non alphanumercial, and capitalized.
 *
 */
AWSClient.prototype.normalize = function(name) {
    name = name.replace(/\s/g, '-').replace('\.', '-');
    return name.split('-').map(function(item) {
        return item && item[0].toUpperCase() + item.slice(1);
    }).join("");
};



/**
 * Describe requested stack.
 * @param stackname cloudformation stackname
 * @return a Promise with Cloud formation Stack.
 */
AWSClient.prototype.describeStack = function(stackname) {
    const self = this;
    return new Promise(function(resolve, reject) {
        if (stackname == null) {
            return reject('stackName missing');
        }
        try {
            self.cloudformation.describeStacks({
                StackName: stackname
            }, function(err, data) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(data.Stacks[0]);
                }
            });
        } catch (e) {
            return reject(e);
        }
    });
};


/**
 * Find dynamodbtable name.
 *
 * @param prefix optional prefix table name
 * @param suffix optional prefix table name
 * @return a Promise of table name array.
 */
AWSClient.prototype.listDynamoDbTable = function(prefix, suffix) {
    const self = this;
    return new Promise(function(resolve, reject) {
        const db = new AWS.DynamoDB();
        db.listTables(function(err, data) {
            if (err) {
                return reject(err);
            }
            if (prefix || suffix) {
                return resolve(data.TableNames.filter(function(name) {
                    return ((prefix) ? name.startsWith(prefix) : true) &&
                        ((suffix) ? name.endsWith(suffix) : true)
                }));
            }
            return resolve(data.TableNames);
        });
    });
}

/**
 * Find dynamodb stream ARN for specifed table name.
 * @param tablename dynamodb table name.
 * @return a promise to stream ARN or undefined.
 */
AWSClient.prototype.findStreamForDynamoDbTable = function(tablename) {
    const self = this;
    return new Promise(function(res, rej) {
        self.dynamodbstreams.listStreams({
            Limit: 1,
            TableName: tablename
        }, function(err, data) {
            if (err) {
                return rej(err);
            }
            if (data.Streams && data.Streams[0]) {
                return res(data.Streams[0].StreamArn);
            }
            return res(undefined);
        });
    });
};
