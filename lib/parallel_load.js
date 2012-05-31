/* Implementation of a parallel function mechanism with a single callback at 
    the end. 

    Example: Suppose you want to perform two server requests at the same time: 

        Parallel p = new Parallel(callback); 

        server1_request(args_1, p.add(id1)); 
        server2_request(args_2, p.add(id2)); 

    The last server to submit the request will end up calling function callback.
    This callback function will receive a map of ids to the responses from that 
    id. 
        

        Based on http://howtonode.org/control-flow
 */
function parallel_load(callback) {
    this.callback = callback;
    this.items = 0;
    this.results = {};
}

parallel_load.prototype = { 
    /* Use this as the callback to the asynchronous function you wish to
       parallelize 
     */
    add : function(id, partialCallback) {
        this.items++;
        var self = this;

        return function(partial_res) { 
            self.results[id] = partial_res;
            self.items--; 

            partialCallback(id, partial_res);

            if (self.items == 0) {
                self.callback(self.results);
            }
        } 
 
    },
};


exports.parallel_load = parallel_load;
