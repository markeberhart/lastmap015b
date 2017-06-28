!function() {
    if(datagobbler){
        datagobbler.ui = function(){
            this.hello = "Hello World";
            return this;
        };
        this.testFunc = function(){
            //console.log("testFunc");
            //float* x, float* y, float* z, float* data, int Ndata, \
            //float* bin_counts, float* bin_values, int nbins_x, int nbins_y, int nbins_z, int Niterations, int Nthreads, int Nsmooth
            var _x;
            var _y;
            var _z;
            var _data;
            var _Ndata;
            var _bin_counts;
            var _bin_values;
            var _nbins_x;
            var _nbins_y;
            var _nbins_z;
            var _Niterations = 180*2;
            var _Nthreads;
            var _Nsmooth;

            //for (var _iteration=0; _iteration<Niterations; ++_iteration) {
               // var _gid = blockIdx.x*blockDim.x + threadIdx.x + _iteration * _Nthreads;
            //}
        }
        testFunc();
    }

    //console.log("DataGobbler-UI",datagobbler.ui);
}();
