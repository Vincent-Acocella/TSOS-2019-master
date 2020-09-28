var TSOS;
(function (TSOS) {
    var DeviceDisplay = /** @class */ (function () {
        function DeviceDisplay() {
            this.startUpMemory();
            this.startUpCPU();
            this.startUpPCB();
        }
        DeviceDisplay.prototype.updateMemory = function () {
            var table = document.getElementById('memoryUnit');
            var index = 0;
            for (var i = 0; i < table.rows.length; i++) {
                for (var j = 1; j < 9; j++) {
                    table.rows[i].cells.item(j).innerHTML = _Memory.memoryThread[index].toString();
                    table.rows[i].cells.item(j).style['font-weight'] = "normal";
                    index++;
                }
            }
        };
        DeviceDisplay.prototype.startUpMemory = function () {
            var table = document.getElementById('memoryUnit');
            for (var i = 0; i < _Memory.memoryThread.length / 8; i++) {
                var row = table.insertRow(i);
                var first = row.insertCell(0);
                var address = i * 8;
                var memUnit = "0x";
                for (var j = 0; j < 3 - address.toString(16).length; j++) {
                    memUnit += "0";
                }
                memUnit += address.toString(16);
                first.innerHTML = memUnit;
                for (var k = 1; k < 9; k++) {
                    var cell = row.insertCell(k);
                    cell.innerHTML = "00";
                }
            }
        };
        DeviceDisplay.prototype.startUpCPU = function () {
            var table = document.getElementById("cpu");
            var header = ["PC", "IR", "ACC", "X", "Y", "Z"];
            var row = table.insertRow(0);
            for (var i = 0; i < header.length; i++) {
                var next = row.insertCell(i);
                next.innerHTML = header[i];
            }
        };
        DeviceDisplay.prototype.startUpPCB = function () {
            var table = document.getElementById("cpu");
            var header = _CPU.returnCPU();
            var row = table.insertRow(1);
            for (var i = 0; i < header.length; i++) {
                var next = row.insertCell(i);
                next.innerHTML = String(header[i]);
            }
        };
        DeviceDisplay.prototype.updateCPU = function () {
        };
        DeviceDisplay.prototype.updatePCB = function () {
        };
        return DeviceDisplay;
    }());
    TSOS.DeviceDisplay = DeviceDisplay;
})(TSOS || (TSOS = {}));