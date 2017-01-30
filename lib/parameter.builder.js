'use strict';

const ParameterBuilder = function(awsClient) {
    this.awsClient = awsClient;
    this.parameters = {};
};

module.exports = ParameterBuilder;


/**
 * Build parameters for specified stackName and using parametersCustomizer.
 * @param stackName cloudformation stack name
 * @param parametersCustomizer optional promise function to customize parameter
 *    (this is bound to ParameterBuilder instance, and stackName is the first parameter)
 * @return parameters object
 */
ParameterBuilder.prototype.build = function(stackName, parametersCustomizer) {
    const self = this;
    return this.aggregateStackNameOutPutAsParameters(stackName)
        .then(function() {
            if (parametersCustomizer) {
                return parametersCustomizer.call(self, stackName);
            }
        }).then(function() {
            return self.parameters;
        });
};

/**
 * Normalize name:
 *  - white space, and dot will be processed as '-' separator.
 *  - each '-' will be removed, and view as a single word to capitalize
 * @param name a name
 * @return name string without non alphanumercial, and capitalized.
 *
 */
ParameterBuilder.prototype.normalize = function(name) {
    return this.awsClient.normalize(name);
};


/**
 * Aggregate named parameters in a array of value. (Usefull to build VPC subnet configuration...).
 * @param names array of parameter name
 * @param target optional target key to set array result
 * @param deletekeys delete names key (tru per default)
 *
 * @return a Promise with array of parameter value
 */
ParameterBuilder.prototype.aggregateParametersAsArray = function(names, target, deletekeys) {
    const self = this;
    deletekeys = deletekeys || true;
    const result = [];
    names.forEach(function(name) {
        if (self.parameters[name]) {
            result.push(self.parameters[name]);
            if (deletekeys)
                delete self.parameters[name];
        }
    });
    if (target) {
        self.parameters[target] = result;
    }
    return Promise.resolve(result);
};

/**
 * Tranform all output parameters of specified stack as parameters.
 * All key parameters are normalized.
 * @param stackname cloudformation stack name
 * @param optional root key to put stack output. if not provided, current parameters will be used.
 * @return a Promise
 */
ParameterBuilder.prototype.aggregateStackNameOutPutAsParameters = function(stackname, rootKey) {
    const self = this;
    return this.awsClient.describeStack(stackname)
        .then(function(stack) {
            if (rootKey) {
                self.parameters[rootKey] = {}
            }
            const target = (rootKey) ? self.parameters[rootKey] : self.parameters;

            stack.Outputs.forEach(function(output) {
                const key = self.normalize(output.OutputKey);
                target[key] = output.OutputValue;
            });
            return;
        });
};


/**
 * Find dynamodb stream ARN for dynamodb table name.
 * All stream ARN are added to parameters with normalized table name plus "StreamArn".
 *
 * @param prefix optional prefix table name
 * @param suffix optional prefix table name
 * @param tableSetKey optional parameter key to put table name (array of string)
 * @return a Promise of array of parameter key.
 */
ParameterBuilder.prototype.listStreamForDynamoDbTable = function(prefix, suffix, tableSetKey) {
    const self = this;
    return this.listDynamoDbTable(prefix, suffix, tableSetKey)
        .then(function(tables) {
            const promises = [];
            const streamKeys = [];
            tables.forEach(function(name) {
                promises.push(
                    self.findStreamForDynamoDbTable(name)
                    .then(function(parameter) {
                        if (parameter) {
                            streamKeys.push(parameter);
                        }
                    }));
            });
            return Promise.all(promises).then(function() {
                return streamKeys;
            });
        });
};

/**
 * Find dynamodbtable name and agregate them tableSetKey parameter arrey.
 *
 * @param prefix optional prefix table name
 * @param suffix optional prefix table name
 * @param tableSetKey optional parameter key to put table name (array of string)
 * @return a Promise of table name array.
 */
ParameterBuilder.prototype.listDynamoDbTable = function(prefix, suffix, tableSetKey) {
    const self = this;
    return this.awsClient.listDynamoDbTable(prefix, suffix)
        .then(function(tables) {
            if (tableSetKey) {
                self.parameters[tableSetKey] = tables;
            }
            return tables;
        });
};

/**
 * Find dynamodb stream ARN for specifed table name.
 * @param tablename dynamodb table name.
 * @return a promise to parameter key name of stream ARN or undefined.
 */
ParameterBuilder.prototype.findStreamForDynamoDbTable = function(tablename) {
    const self = this;
    return this.awsClient.findStreamForDynamoDbTable(tablename)
        .then(function(streamArn) {
            if (streamArn) {
                var key = self.normalize(tablename + "-streamArn");
                self.parameters[key] = streamArn;
                return key;
            }
            return undefined;;
        });
};


/**
 * Print current configuration.
 */
ParameterBuilder.prototype.printConfig = function() {
    console.log("------------------------------------------------------")
    console.log("Parameters", JSON.stringify(this.parameters, null, 2));
};
