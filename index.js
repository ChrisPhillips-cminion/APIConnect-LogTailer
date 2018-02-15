var Client = require('ssh2').Client;
var inquirer = require("inquirer");
var conn = new Client();

var fet = require('foreachthen');
var fs = require('fs');
var i = 0;
var p = [];
var q = [];


var inquirer = require('inquirer');

var questions = [{
        type: 'input',
        name: 'server',
        message: "API Manager Host exposing port 22"
    },
    {
        type: 'password',
        name: 'password',
        message: 'Admin user\'s Password',
        default: function() {
            return '!n0r1t5@C';
        }
    },
    {
        type: 'input',
        name: 'out',
        message: 'Output Directory',
        default: function() {
            return './out/';
        }
    }, {
        type: 'checkbox',
        message: 'Select which files to tail. It is not recommended to tail more then a few files',
        name: 'files',
        choices: [
            new inquirer.Separator(' == Common Files == '),
            {
                name: '/var/log/messages'
            },
            {
                name: '/var/log/cmc.out'
            },
            {
                name: '/var/log/couchdb/couch.log'
            },
            {
                name: '/var/log/informix/jsonListener.log'
            },

            new inquirer.Separator(' == Other Files == '),
            {
                name: '/var/log/install'
            },
            {
                name: '/var/log/billing.log'
            },
            {
                name: '/var/log/arbd_stdout.log'
            },
            {
                name: '/var/log/couchdb/couchdb_post_boot.log'
            },
            {
                name: '/var/log/databaseCleanup.log'
            },
            {
                name: '/var/log/migration.log'
            },
            {
                name: '/var/log/hasd.log'
            },
            {
                name: '/var/log/couchdb_replication.log'
            },
            {
                name: '/var/log/logrotate.status'
            },
            {
                name: '/var/log/v2apimanager.log'
            },
            {
                name: '/var/log/default-trace'
            },
            {
                name: '/var/log/systemmanager.log'
            },
            {
                name: '/var/log/status.log'
            },
            {
                name: '/var/log/essync.log'
            },
            {
                name: '/var/log/apim_rproxy_rewrite.log'
            },
            {
                name: '/var/log/product-insights.log'
            },
            {
                name: '/var/log/logstash.log'
            },
            {
                name: '/var/log/logstashconfigure.log'
            },
            {
                name: '/var/log/informix/online.log'
            },
            {
                name: '/var/log/informix/apim-init.log'
            },
            {
                name: '/var/log/informix/connectmgr.log'
            },
            {
                name: '/var/log/config_backup.log'
            },
            {
                name: '/var/log/router.log'
            },
            {
                name: '/var/log/kibana.log'
            },
            {
                name: '/var/log/arbd.log'
            },
            {
                name: '/var/log/couchdb_replication_sessions.log'
            },
            {
                name: '/var/log/ secure'
            },
            {
                name: '/var/log/topology-config.json'
            },
            {
                name: '/var/log/arbd_stderr.log'
            },
            {
                name: '/var/log/router.stat'
            },
            {
                name: '/var/log/platinfo'
            },
            {
                name: '/var/log/health_check.log'
            },
            {
                name: '/var/log/spam.log'
            },
            {
                name: '/var/log/couchdb_replication_etag.log'
            },
            {
                name: '/var/log/elasticsearch/apiconnect_analytics.log'
            },
            {
                name: '/var/log/elasticsearch/es_startup_tasks.log'
            },
            {
                name: '/var/log/elasticsearch/apiconnect_analytics_deprecation.log'
            },
            {
                name: '/var/log/elasticsearch/apiconnect_analytics_index_search_slowlog.log'
            },
            {
                name: '/var/log/elasticsearch/apiconnect_analytics_index_indexing_slowlog.log'
            },
            {
                name: '/var/log/elasticsearch/elasticsearch.log'
            },
            {
                name: '/var/log/couchdb_replication_apim.log'
            },
            {
                name: '/var/log/apim_rproxy_access.log'
            },
            {
                name: '/var/log/sessions.log'
            },
            {
                name: '/var/log/cron'
            },
            {
                name: '/var/log/apim_rproxy_error.log'
            },
            {
                name: 'tmp/informix/onstat-a.out'
            },
            {
                name: 'tmp/informix/onstat-gses0.out'
            },
            {
                name: 'tmp/informix/onstat-stkall.out'
            },
            {
                name: 'tmp/informix/onstat-a.out'
            },
            {
                name: 'tmp/userfiles/bedrock-pd.txt'
            }
        ],
        validate: function(answer) {
            if (answer.length < 1) {
                return 'You must choose at least entry.';
            }
            return true;
        }
    }

];


inquirer.prompt(questions).then(answers => {
    // console.log(JSON.stringify(answers, null, '  '));

    outPutDir = answers.out;
    console.log(answers.files);
    var config = {
        host: answers.server,
        port: 22,
        username: 'admin',
        password: answers.password
    };


    answers.files.forEachThenSeries(function(cb, filePath) {
        var folder = require('path').dirname(filePath);

        require('mkdirp')(outPutDir + folder, function(err) {
            if (err) console.error(err)
        });

        i++;
        if (i == 5) {
            i = 0;
            p.push(q);
            q = [];
            q.push(filePath);
            cb();
        } else {
            q.push(filePath);
            cb();
        }

    }, function() {
        p.push(q);
        p.forEach(function(q) {
            connect(config, q, outPutDir);
        });
    });
});

function connect(config, q, outPutDir) {
    var conn = new Client()
    conn.on('ready', function() {
        q.forEach(function(q) {
            captureFile(q, conn, outPutDir);
        });
    }).connect(config);
    return conn;
}

function captureFile(fileName, conn, outPutDir) {
    conn.exec('debug tail file ' + fileName, function(err, stream) {
        if (err) {
            console.log('Logging ' + fileName)
            throw err;
        }
        stream.on('close', function(code, signal) {
            console.log('Stream :: close :: file: ' + fileName + ' code: ' + code + ', signal: ' + signal);
        }).on('data', function(data) {
            appendToFile(outPutDir + fileName, data);
        }).stderr.on('data', function(data) {
            appendToFile(outPutDir + fileName, 'STDERR: ' + data);
        });
    });
}

function appendToFile(path, message) {
    fs.appendFile(path, message, function(err) {
        if (err) throw err;
    });
}
