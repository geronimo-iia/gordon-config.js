# Gordon-config

Warn: Work in progress

This tools aim to use with [gordon](https://github.com/jorgebastida/gordon) which is a excellent lambda deployment tool on AWS platform.
Gordon-config help us to configure gordon settings and parameter by calling other cloud formation stack.

Why this tool:
- We have several AWS account to manage
- Each account have custom configuration for the same application code
- We have several lambda runtime to manage (python, nodejs)
- We using a lot cloud formation

We started to wrote using nodejs for quickly obtain a prototype. We have in mind to:
- rewrite with python very soon.
- share this work to gordon project


# Command line tool

For help
```
gordon-config -h

usage: gordon-config [-h] [-v] [-s STACK_NAME] [-n NAME] [-p PROFILE]
                     [-r REGION] [-t TEMPLATE]
                     output

Gordon configuration utility.

Positional arguments:
  output                Directory where to write output.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -s STACK_NAME, --stack-name STACK_NAME
                        Cloudformation stack name.
  -n NAME, --name NAME  Stage name.
  -p PROFILE, --profile PROFILE
                        Optional AWS profile name.
  -r REGION, --region REGION
                        Optional AWS region name.
  -t TEMPLATE, --template TEMPLATE
                        Optional settings template file.
```



# Main Usage: Add cloudformation stack output as parameters

We start by using:
 - a "settings.yml" as template,
 - a cloud formation stack name
 - an output target directory
 - a stage name
 - optional AWS configuration parameter (region, or named profile ). Use standard AWS environment variable to configure AWS access.


First, install gordon-config:

```
npm install gordon-config
```

Run tool

```
node ./node_module/bin/gordon-config -s mystack -name 'dev' .
```

Main process is:
- describe cloud formation stack named 'mystack'
- Transform all output parameters as parameters for gordon
- write stage yaml parameters file as 'dev'
- write settings yaml file


 After running, the tools write:
 - ./settings.yml
 - ./parameters/{{stage}}.yml (in our example: ./parameters/dev.yml )

After this process you can using gordon as usual:
```
gordon build
gordon apply -s {{stage}}
# in our example: gordon apply -s dev
```


# Customize parameters and settings


Customize parameters to put:
- external parameters which define your stack (customer, stage, ...)
- build VPC subnet list
- aggregate another cloud formation stack parameter

Customize settings to put lambda trigger dynamically (based on parameters for example)


TODO: add code sample


# build, deploy, etc ..

```
npm install
```

TODO:
- add test
- publish first version on npm
- add example


# MIT License

```
The MIT License (MIT)

Copyright 2017 Jérôme Guibert (jguibert@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
