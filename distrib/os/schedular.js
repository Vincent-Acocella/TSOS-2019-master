var TSOS;
(function (TSOS) {
    var Schedular = /** @class */ (function () {
        function Schedular() {
            //across
            // 0 = progNumber
            // 1 = PC
            // 2 = ACC
            // 3 = Xreg
            // 4 = YReg
            // 5 = ZReg
            // 6 = IR 
            // 7 = state
            // 8 = priority
            // 8 = location state
            // 9 = location
            // 10 = timeAdded
            //Depresiated
            // 10 = end of prog
            //TODO: Update
            this.readyQueue = new TSOS.Queue;
            this.allProcesses = [];
            this.quant = _Quant;
        }
        Schedular.prototype.init = function () {
        };
        //--------------------------------------------------------
        //QUANT
        Schedular.prototype.setQuant = function (value) {
            _Quant = value;
            this.quant = value;
        };
        Schedular.prototype.refreshQuant = function () {
            this.quant = _Quant;
        };
        Schedular.prototype.decreaseQuantum = function () {
            this.quant--;
            console.log("Quantum now equals: " + this.quant);
        };
        //--------------------------------------------------------
        //DEPLOY PROCCESS
        //Main funtion to return the PCB back to the array
        Schedular.prototype.addProccess = function (PID) {
            this.allProcesses[PID] = _PCB.returnPCB().slice(0);
            _DeviceDisplay.startUpSchedular();
        };
        //Used to deploy to the CPU
        //Can be used after switch or initial start
        Schedular.prototype.deployFirstInQueueToCPU = function () {
            //This is the data we want
            var firstIndex = this.readyQueue.peek();
            if (_MemoryAccessor.getProgFromSegMap(firstIndex) === -1) {
                console.log("Come in here");
                //see if there's an open spot in memory on process terminate
                var openSeg = _MemoryManager.deployNextSegmentForUse();
                if (openSeg > 0) {
                    //Open ice take advantage
                    _KernelInputQueue.enqueue(new TSOS.Interrupt(DISKDRIVER_IRQ, [ROLLINPROG, firstIndex]));
                }
                else {
                    var pidToSwap = void 0;
                    //Checks
                    //RR enabled
                    //Priority Enabled
                    //Set the PCB to the info we want to switch
                    switch (_ActiveSchedular) {
                        case _RoundRobin:
                            console.log("NOOOOjsndfnjasddmsakmf");
                            var oldPID = _PCB.PID;
                            //Reset location
                            _MemoryAccessor[_PCB.location] = true;
                            //set new map
                            _MemoryAccessor.setSegtoMemMap(firstIndex, _PCB.location);
                            //update process
                            _PCB.location = 9;
                            _PCB.locationState = "Disk";
                            //time to swap
                            //get previous segment and deploy it to the disk
                            //get last in ready queue 
                            _KernelInputQueue.enqueue(new TSOS.Interrupt(DISKDRIVER_IRQ, [ROLLOUTPROG, oldPID]));
                            //put in location
                            _KernelInputQueue.enqueue(new TSOS.Interrupt(DISKDRIVER_IRQ, [ROLLINPROG, firstIndex,]));
                            this.addProccess(_PCB.PID);
                            break;
                        case _FCFS:
                            //Take out last entered in memory
                            break;
                        case _PRIORITY:
                            break;
                        default:
                            console.log("Come here");
                            //Single Run of process
                            //Take process process in block 3
                            pidToSwap = _MemoryAccessor.programToSegmentMap[2];
                    }
                    this.allProcesses[pidToSwap][7] = "Swap";
                    //Set the page table
                    _MemoryManager.avaliableMemory[this.allProcesses[pidToSwap][8]] = true;
                    _MemoryAccessor.setSegtoMemMap(firstIndex, this.allProcesses[pidToSwap][8]);
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(DISKDRIVER_IRQ, [ROLLOUTPROG, pidToSwap, _Memory.memoryThread[this.allProcesses[pidToSwap][8]].toString().replace(/,/g, '')]));
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(DISKDRIVER_IRQ, [ROLLINPROG, firstIndex]));
                    this.allProcesses[pidToSwap][8] = 9;
                }
                //we deploy but the info doesn't get there until interputs
            }
            // console.log("Now Executing process:  " + firstIndex);
            this.allProcesses[firstIndex][7] = "Executing";
            //this.allProcesses[firstIndex][7] = "Memory";
            var array = this.allProcesses[firstIndex];
            _PCB.loadPCB(array[0], array[1], array[2], array[3], array[4], array[5], array[6], array[7], array[8], array[9]);
            _PCB.loadCPU();
            // Load PCB then put into CPU
        };
        Schedular.prototype.startCpu = function () {
            this.refreshQuant();
            this.deployFirstInQueueToCPU();
            _DeviceDisplay.startUpSchedular();
            _CPU.isComplete = false;
        };
        //--------------------------------------------------------
        //SWITCH MEMORY
        Schedular.prototype.switchMemoryInterupt = function () {
            //Take PCB
            _PCB.copyCPU();
            _PCB.state = "Waiting";
            this.addProccess(_PCB.PID);
            this.switchMemoryUnit();
            this.startCpu();
            _DeviceDisplay.cycleReload();
        };
        //Update ready queue
        Schedular.prototype.switchMemoryUnit = function () {
            this.readyQueue.enqueue(this.readyQueue.dequeue());
        };
        Schedular.prototype.checkIfSwitch = function () {
            if (this.quant === 1) {
                //queue up switch
                return true;
            }
            else {
                //decrease quant if there are more than 1 in ready queue
                this.decreaseQuantum();
                return false;
            }
        };
        //--------------------------------------------------------
        //READY QUEUE
        Schedular.prototype.addToReadyQueue = function (PID) {
            var added = false;
            if (!this.alreadyExistsInQueue(PID)) {
                this.readyQueue.enqueue(PID);
                _DeviceDisplay.updateReadyQueue();
                added = true;
            }
            return added;
        };
        Schedular.prototype.removeFromReadyQueue = function () {
            this.readyQueue.dequeue();
            _PCB.updateScheduler();
            _DeviceDisplay.cycleReload();
        };
        Schedular.prototype.addAllToReadyQueue = function () {
            //3 is the number of segments in memory
            var added = false;
            for (var prog in _MemoryAccessor.logicalMemory) {
                this.addToReadyQueue(prog);
                added = true;
            }
            if (added) {
                //TODO: Organize depending on schedule
                _CPU.isExecuting = true;
                this.deployFirstInQueueToCPU();
                _DeviceDisplay.updateReadyQueue();
            }
            else {
                _StdOut.putText("No more programs to execute");
            }
        };
        //UTIL
        Schedular.prototype.alreadyExistsInQueue = function (prog) {
            console.log(this.readyQueue.getSize());
            for (var i = 0; i < this.readyQueue.getSize(); i++) {
                var pullVal = this.readyQueue.dequeue();
                this.readyQueue.enqueue(pullVal);
                if (parseInt(pullVal) === parseInt(prog)) {
                    return true;
                }
            }
            return false;
        };
        //Check if the last program is finsihed executing
        Schedular.prototype.processComplete = function () {
            this.removeFromReadyQueue();
            if (this.readyQueue.getSize() === 0) {
                _CPU.isExecuting = false;
            }
            else {
                this.startCpu();
            }
        };
        return Schedular;
    }());
    TSOS.Schedular = Schedular;
})(TSOS || (TSOS = {}));
