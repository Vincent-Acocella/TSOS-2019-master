var TSOS;
(function (TSOS) {
    var DeviceDiskDriver = /** @class */ (function () {
        function DeviceDiskDriver(nextAvaliableBlock) {
            if (nextAvaliableBlock === void 0) { nextAvaliableBlock = 1; }
            this.nextAvaliableBlock = nextAvaliableBlock;
        }
        DeviceDiskDriver.prototype.init = function () {
        };
        DeviceDiskDriver.prototype.formatDisk = function () {
            //directory
            var index = 0;
            if (sessionStorage.getItem('0:0;0') === null) {
                //First instance is always in use
                //used to hold next aval
                //take SingleDiskclass
                for (var i = 0; i <= 3; i++) {
                    for (var k = 0; k <= 7; k++) {
                        for (var j = 0; j <= 7; j++) {
                            var newDisk = new TSOS.Disk;
                            if (index === 0)
                                newDisk.setAvalibility(1);
                            sessionStorage.setItem(i + ": " + j + ": " + k, newDisk.storeInSession());
                            index++;
                        }
                    }
                }
                return true;
            }
            return false;
        };
        DeviceDiskDriver.prototype.createFile = function (fileName) {
            //to create a file we put the name in hex (if it doesn't already exist) in the data at the next avaliable spot
            if (this.checkOut(fileName)) {
                var avaliableBlock = JSON.parse(sessionStorage.getItem("0:0:" + this.nextAvaliableBlock));
                console.log(avaliableBlock.avalibility);
                //No more use
                avaliableBlock.data[0] = 1;
                avaliableBlock.avalibility = 1;
                // let dataIndex = 3;
                // for(let i = 0; i< fileName.length; i++){
                //     avaliableBlock.data[dataIndex] = this.convertToHexByLetter(fileName.charAt(i))
                // }
            }
        };
        DeviceDiskDriver.prototype.updateNextAvaliable = function (val) {
            if (val < this.nextAvaliableBlock) {
                this.nextAvaliableBlock = val;
            }
        };
        DeviceDiskDriver.prototype.getNextAvaliable = function () {
        };
        DeviceDiskDriver.prototype.convertToHexByLetter = function (char) {
            return parseInt(char, 16);
        };
        DeviceDiskDriver.prototype.checkOut = function (str) {
            //make sure avaliable exists
            //make sure no names match
            for (var i = 0; i < 8; i++) {
            }
            return true;
        };
        return DeviceDiskDriver;
    }());
    TSOS.DeviceDiskDriver = DeviceDiskDriver;
})(TSOS || (TSOS = {}));
