define(function(require, exports, module) {
    main.consumes = ["Plugin", "installer", "proc"];
    main.provides = ["installer.npm"];
    return main;
    
    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var installer = imports.installer;
        var proc = imports.proc;
        
        var binBash = options.binBash || "bash";
        
        var plugin = new Plugin("Ajax.org", main.consumes);
        
        /**
         * Installs an NPM package
         */
        function execute(task, options, onData, callback) {
            // node-gyp uses sytem node or fails with command not found if
            // we don't bump this node up in the path
            var script = 'set -e\n'
                + 'C9_DIR="$HOME/.c9"\n'
                + 'PATH="$C9_DIR/node/bin/:$C9_DIR/node_modules/.bin:$PATH"\n'
                + '$C9_DIR/node/bin/npm install -g ' + task;
            
            proc.spawn(binBash, {
                args: ["-c", script],
                cwd: options.cwd || null
            }, function(err, process){
                if (err) return callback(err);
                
                // Pipe the data to the onData function
                process.stdout.on("data", function(chunk){
                    onData(chunk, "stdout");
                });
                process.stderr.on("data", function(chunk){
                    onData(chunk, "stderr");
                });
                
                // When process exits call callback
                process.on("exit", function(code){
                    if (!code) callback();
                    else callback(new Error("Failed. Exit code " + code));
                });
            });
        }
        
        plugin.on("load", function() {
            installer.addPackageManager("npm", plugin);
        });
        plugin.on("unload", function() {
            installer.removePackageManager("npm");
        });
        
        plugin.freezePublicAPI({ execute: execute });
        
        register(null, {
            "installer.npm": plugin
        });
    }
});