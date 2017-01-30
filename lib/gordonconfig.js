'use strict';
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');
const AwsClient = require('./awsclient');
const ParameterBuilder = require('./parameter.builder');
const SettingBuilder = require('./setting.builder');

/**
 * Instanciate a new GordonConfig instance.
 * @param region optional AWS region
 * @param profile optional AWS profile
 */
const GordonConfig = function(region, profile) {
    this.verbose = true;
    const awsClient = new AwsClient(region, profile);
    this.parameterBuilder = new ParameterBuilder(awsClient);
    this.settingBuilder = new SettingBuilder(awsClient);
    this.settingPath = undefined;
    this.settingsCustomizer = undefined;
    this.parametersCustomizer = undefined;
};

module.exports = GordonConfig;

GordonConfig.prototype.silent = function() {
    this.verbose = true;
    return this;
};

/**
 * Add specified settings template
 * @param settingPath setting path
 * @return this GordonConfig instance
 **/
GordonConfig.prototype.addSettingTemplate = function(settingPath) {
    this.settingPath = settingPath;
    return this;
};

/**
 * Add specified settings customizer function
 * @param settingsCustomizer  settings customizer function
 * @return this GordonConfig instance
 **/
GordonConfig.prototype.addSettingsCustomizer = function(settingsCustomizer) {
    this.settingsCustomizer = settingsCustomizer;
    return this;
};

/**
 * Add specified parameters customizer function
 * @param parametersCustomizer parameters customizer function
 * @return this GordonConfig instance
 **/
GordonConfig.prototype.addParametersCustomizer = function(parametersCustomizer) {
    this.parametersCustomizer = parametersCustomizer;
    return this;
};

/**
 * Normalize name:
 *  - white space, and dot will be processed as '-' separator.
 *  - each '-' will be removed, and view as a single word to capitalize
 * @param name a name
 * @return name string without non alphanumercial, and capitalized.
 *
 */
GordonConfig.prototype.normalize = function(name) {
    return this.parameterBuilder.normalize(name);
};

/**
 * Build configuration.
 *
 * @return a resolved Promise
 */
GordonConfig.prototype.build = function(stackname) {
    var self = this;
    return this.parameterBuilder.build(stackname, this.parametersCustomizer)
        .then(function(parameters) {
            return self.settingBuilder.build(parameters, self.settingPath, self.settingsCustomizer);
        })
        .then(function() {
            if (self.verbose) {
                self.printConfig();
            }
            return Promise.resolve();
        });
};



/**
 * Print current configuration.
 * @return a resolved promise.
 */
GordonConfig.prototype.printConfig = function() {
    this.parameterBuilder.printConfig();
    this.settingBuilder.printConfig();
    return Promise.resolve();
};



/**
 * Write current configuration.
 *
 * @param stage stage name
 * @param directory path
 * @return a Promise
 **/
GordonConfig.prototype.write = function(stage, directoryPath) {
    var self = this;
    return new Promise(function(resolve, reject) {
        ensureExists(path.resolve(directoryPath, 'parameters'), function(err, result) {
            if (err) {
                return reject(err);
            }
            var file = path.resolve(directoryPath, 'parameters', stage + '.yml');
            fs.writeFile(file, YAML.stringify(self.parameterBuilder.parameters, 4), function(err) {
                if (err) {
                    return reject(err);
                }
                if (self.verbose) {
                    console.log("wrote stage parameters '%s' to '%s'", stage, file);
                }
                return resolve(self);
            });
        });

    }).then(new Promise(function(resolve, reject) {
        var file = path.resolve(directoryPath, 'settings.yml');
        fs.writeFile(file, YAML.stringify(self.settingBuilder.settings, 4), function(err) {
            if (err) {
                return reject(err);
            }
            if (self.verbose) {
                console.log("wrote settings '%s'", file);
            }
            return resolve(self);
        });
    }));
}

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = '0777';
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') {
                return cb(null);
            }
            return cb(err);
        }
        return cb(null);
    });
}
