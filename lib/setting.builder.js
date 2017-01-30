'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');

const SettingBuilder = function(awsClient) {
    this.awsClient = awsClient;
    this.settings = {};
};

module.exports = SettingBuilder;


/**
 * Normalize name:
 *  - white space, and dot will be processed as '-' separator.
 *  - each '-' will be removed, and view as a single word to capitalize
 * @param name a name
 * @return name string without non alphanumercial, and capitalized.
 *
 */
SettingBuilder.prototype.normalize = function(name) {
    return this.awsClient.normalize(name);
};

/**
 * Build parameters for specified stackName and using parametersCustomizer.
 *
 * @param parameters parameters object
 * @param settingPath optional settings path
 * @param settingsCustomizer optional promise function to customize settings
 *    (this is bound to SettingBuilder instance, and parameters is the first parameter)
 * @return settings object
 */
SettingBuilder.prototype.build = function(parameters, settingPath, settingsCustomizer) {
    const self = this;
    return new Promise(function(resolve, reject) {
        if (settingPath) {
            self.settings = self.loadTemplate(settingPath);
        }
        return resolve();
    }).then(function() {
        if (settingsCustomizer) {
            return settingsCustomizer.call(self, parameters);
        }
    }).then(function() {
        return self.settings;
    });
};

/**
 * Load specified YAML file and return object version.
 * @param settingPath settings path
 * @return object
 **/
SettingBuilder.prototype.loadTemplate = function(settingPath) {
    return YAML.load(settingPath);
};

/**
 * @param parameters parameters
 * @param key parameter name
 * @return if key exists return a reference of this parameter, else return undefined.
 **/
SettingBuilder.prototype.reference = function(parameters, key) {
    return parameters[key] ? "ref://" + key : undefined;
};

/**
 * Add a vpc definition.
 * @param name vpc name
 * @param subnets array of subnet or parameter reference
 * @param securityGroups array of security group or parameter reference
 */
SettingBuilder.prototype.defineVPC = function(name, subnets, securityGroups) {
    this.settings['vpcs'] = this.settings['vpcs'] || {};
    this.settings['vpcs'][name] = {
        'security-groups': subnets,
        'subnet-ids': securityGroups
    }
};


/**
*
@param name handler name
@param lambdaName lambda application name
@param streamArn stream arn value of referenced parameters
@param batchSize batch size parameter (75 per default)
@param startingPosition starting position (TRIM_HORIZON per default)
*/
SettingBuilder.prototype.defineDynamoDbTrigger = function(name, lambdaName, streamArn, batchSize, startingPosition) {
    this.settings['dynamodb'] = this.settings['dynamodb'] || {};
    this.settings['dynamodb'][name] = {
        'lambda': lambdaName,
        'stream': streamArn,
        'batch_size': batchSize || 75,
        'starting_position': startingPosition || "TRIM_HORIZON"
    }
};


/**
 * Print current configuration.
 */
SettingBuilder.prototype.printConfig = function() {
    console.log("------------------------------------------------------")
    console.log("Settings", JSON.stringify(this.settings, null, 2));
};
