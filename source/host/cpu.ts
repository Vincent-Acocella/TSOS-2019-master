/* ------------
     CPU.ts

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    //Fix print

    export class Cpu {

        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public IR: string = "0",
                    public endOfProg = 0,
                    public bytesNeeded = 0,
                    public segment = -1,
                    public interuptToCall = "",
                    public isComplete = false,
                    public isExecuting: boolean = false) {
        }

        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.IR = "";
            this.endOfProg = 0;
            this.segment = -1;
            this.isComplete = false;
            this.bytesNeeded = 0;
            this.isExecuting = false;
            this.interuptToCall = "";
        }

        public cycle(): void {
            console.log("----------Cycle-----------------")

            _Kernel.krnTrace('CPU cycle');
            let moveThatBus = this.fetch(this.PC);
            
            if (moveThatBus + this.PC > 256) {
                this.PC = (this.PC + moveThatBus) % 256;
            }
            else {
                this.PC += moveThatBus;
            } 

            console.log("SIze of Queue: " + _Schedular.readyQueue.getSize())
            //Queue interupt
            if(!this.isComplete && _Schedular.readyQueue.getSize() > 1 && _Schedular.checkIfSwitch()){
                console.log("helloasdfkjasjkdofjopasdjpofjposadjpofjpsajpodfjpasdfop")
                //Break calls an interupt so we wait
                    // interupt switch memory
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SWITCH_MEMORY, ["Switching Memory"]));
            }
            console.log("PC = " + this.PC);
            _PCB.updateScheduler();
            _DeviceDisplay.cycleReload();
        }

        public fetch(PC){

            let opCode = _MemoryAccessor.read(PC,this.segment)
            console.log("Op code: " + opCode)
            this.IR = opCode.toString();

            switch(opCode){
                //Load the accumulator with a constant
                case "A9":
                    this.loadAcc(PC);
                    break;

                //Load the accumulator from memory
                case "AD":
                    this.loadAccFrmMem(PC);
                    break;

                //store the accumulator in memory
                case "8D":
                    this.strAccInMem(PC);
                    break;

                //Add a carry
                case "6D":
                    this.addCarry(PC);
                    break;

                //Load the X register with a constant
                case "A2":
                    this.loadXregCons(PC);
                    break;

                //Load the X register from memory
                case "AE":
                    this.loadXregMem(PC);
                    break;

                //Load the Y register with a constant
                case "A0":
                    this.loadYregCons(PC);
                    break;

                //Load the Y register from memory
                case "AC":
                    this.loadYregMem(PC);
                    break;

                //No operation
                case "EA":
                    this.bytesNeeded = 1;
                    break;

                //break (which is really a system call)
                case "00":
                    this.break();
                    break;

                //compare a byte in memory to the X reg. sets Z flag if =
                case "EC":
                    this.compXmem(PC);
                    break;

                //Branch n bytes if Z flag = 0
                case "D0":
                    this.branchIfZ(PC);
                    break;

                //Increment the value of a byte
                case "EE":
                    this.incremVal(PC);
                    break;

                //System Call
                case "FF":
                    this.systemCall(PC);
                    break;
                default:

            }
            return this.bytesNeeded;
        }

//----------------------------------------------------------------------------------
        //Bytes needed = 1
        //FF

        public systemCall(code){
            this.bytesNeeded = 1;
            console.log("The X register for the SC: " + +this.Xreg)

            switch (parseInt(this.Xreg.toString())) {
                case 1: // Print integer from y register
                    this.printIntYReg();
                    break;
                case 2: // Print 00 terminated string from y register
                    this.printStringYReg();
                    break;
                default:
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERMINATE_STRING, ["Invalid system call operation, stoping execution."]));
            }
        }

//----------------------------------------------------------------------------------
        //good
        //A9
        private loadAcc(value) {
            this.bytesNeeded = 2;

            //Loads next value in memory
            let newValue = _MemoryAccessor.read(value+1, this.segment); 
            console.log(newValue)
            this.Acc = newValue;
        }

        //All of this has to change
//----------------------------------------------------------------------------------
        //good
        //AD
        private loadAccFrmMem(value) {
            this.bytesNeeded = 3;

            //First byte is the op
            //Second is the segment
            //thrid is the location

          let segmentToLook:number =  this.returnSegmentFromMemory(_MemoryAccessor.read(value+2, this.segment));
          
          if(segmentToLook < 0){
              _StdOut.putText("Invalid opcode detected")
          }else{
            //value + 1 is base 10
            let valueInMemory = _MemoryAccessor.read((value+1), segmentToLook);
            console.log("Value" + valueInMemory)
            this.Acc = valueInMemory;
          }
        }

//----------------------------------------------------------------------------------
        //good
        //8D

        //Store the Acc in memory
        //value +2 is where to store 
        private strAccInMem(value) {
            this.bytesNeeded = 3;

            let segmentToLook:number =  this.returnSegmentFromMemory(_MemoryAccessor.read(value+2, this.segment));
           
            if(segmentToLook < 0){
                 _StdOut.putText("Invalid opcode detected")
            }else{
                let spotInMem = this.convfromHex(_MemoryAccessor.read((value+1),segmentToLook));
                _MemoryAccessor.write((this.Acc.toString()), segmentToLook, spotInMem);
          }
        }

//----------------------------------------------------------------------------------

//Take value in memory and add it to the accumulator 
        //6D
        private addCarry(value) {
            this.bytesNeeded = 3;
            let segmentToLook:number =  this.returnSegmentFromMemory(_MemoryAccessor.read(value+2, this.segment));
           
            if(segmentToLook < 0){
                 _StdOut.putText("Invalid opcode detected")
            }else{

                let valueToLook = this.convfromHex(_MemoryAccessor.read(value+1, segmentToLook));
                console.log(parseInt(this.Acc.toString()) + parseInt(_Memory.memoryThread[segmentToLook][valueToLook]))
                
                //COmes in as 01 change
                this.Acc = parseInt(this.Acc.toString()) + parseInt(_Memory.memoryThread[segmentToLook][valueToLook]);
            }
        }

//----------------------------------------------------------------------------------
        //A2

        private loadXregCons(value) {
            this.bytesNeeded = 2;
            this.Xreg = _MemoryAccessor.read(value+1, this.segment);
        }

//----------------------------------------------------------------------------------
        //AE

        private loadXregMem(value) {
            this.bytesNeeded = 3;

            let segmentToLook:number =  this.returnSegmentFromMemory(_MemoryAccessor.read(value+2, this.segment));
           
            if(segmentToLook < 0){
                 _StdOut.putText("Invalid opcode detected");
            }else{
                //Returns the value in memory in this case we are loading that into y
                let spotInMem = this.convfromHex(_MemoryAccessor.read(value+1, segmentToLook));
                this.Xreg = _Memory.memoryThread[segmentToLook][spotInMem];
            }
        }
//----------------------------------------------------------------------------------
        //A0
        private loadYregCons(value) {
            this.bytesNeeded = 2; 
            this.Yreg = _MemoryAccessor.read(value + 1, this.segment);
        }
//----------------------------------------------------------------------------------
        //AC
        private loadYregMem(value) {
            this.bytesNeeded = 3;

            let segmentToLook:number =  this.returnSegmentFromMemory(_MemoryAccessor.read(value+2, this.segment));
           
            if(segmentToLook < 0){
                 _StdOut.putText("Invalid opcode detected");
            }else{
                let spotInMem = this.convfromHex(_MemoryAccessor.read(value+1, segmentToLook));
                this.Yreg = _Memory.memoryThread[segmentToLook][spotInMem];
            }
        }
//----------------------------------------------------------------------------------
        //EC
        private compXmem(value) {
            this.bytesNeeded = 3;

            let segmentToLook:number =  this.returnSegmentFromMemory(_MemoryAccessor.read(value+2, this.segment));
           
            if(segmentToLook < 0){
                 _StdOut.putText("Invalid opcode detected");
            }else{

                let spotInMem = this.convfromHex(_MemoryAccessor.read(value+1, segmentToLook));
                console.log("SPot in memory" + spotInMem)
                let valueToCompair = parseInt((_Memory.memoryThread[segmentToLook][spotInMem]));
                
                console.log("X register: " + parseInt(this.Xreg.toString()))
                console.log("Compair: "+ valueToCompair)
    
                if(parseInt(this.Xreg.toString()) === valueToCompair){
                    this.Zflag = 1;
                }else{
                    this.Zflag = 0;
                }
             }
        }
//----------------------------------------------------------------------------------
        //D0
        private branchIfZ(value) {
            if(this.Zflag === 0){
                //Gets location to set the program counter to
                // this.PC = this.convToHex(_Memory.memoryThread[value + 1]);
                //If we are branching to 0
                if(value === 0){
                    this.bytesNeeded = 1;
                }else{
                    console.log((this.convfromHex(_MemoryAccessor.read(value+1, this.segment))+2))
                    this.bytesNeeded = (this.convfromHex(_MemoryAccessor.read(value+1, this.segment))+2);
                }
            }else{
                this.bytesNeeded = 2;
            }
        }

//----------------------------------------------
        //EE
        private incremVal(value) {
            this.bytesNeeded = 3;

            let segmentToLook:number =  this.returnSegmentFromMemory(_MemoryAccessor.read(value+2, this.segment));
           
            if(segmentToLook < 0){
                _StdOut.putText("Invalid opcode detected");
            }else{
                let location = this.convfromHex(_MemoryAccessor.read(value+1, this.segment));
                _Memory.memoryThread[segmentToLook][location]++; 
                console.log("Increase Value at: " +  location + "To: " + _Memory.memoryThread[segmentToLook][location]);
            }
        }
//----------------------------------------------------
        private break() {
            this.isComplete = true;
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(STOP_EXEC_IRQ, ["PID " + _PCB.PID + " has finished."]));
        }
  //----------------------------------------------------------------------------------
        private printIntYReg(){
            // #$01 in X reg = print the integer stored in the Y register.
            _StdOut.putText(parseInt(this.Yreg.toString()).toString());
           //_KernelInterruptQueue.enqueue(new TSOS.Interrupt(PRINT_YREGInt_ERQ, ["Printing int from X register"]));
        }

        private printStringYReg(){
            // #$02 in X reg = print the 00-terminated string stored at the address in
            //  the Y register.
            
            let output = "";
            let i = this.convfromHex(this.Yreg);
            console.log("Printing out " + i);
            let locInMem = _MemoryAccessor.read(i ,this.segment);
            
            while(locInMem !== "00"){
                output += String.fromCharCode(this.convfromHex(locInMem));
                i++;
                locInMem = _MemoryAccessor.read(i,this.segment);
            }
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERMINATE_STRING, [output]));
        }

// ----------------------------------------------------------------------------------
        //CPU Utils
        public returnCPU(){
            return [this.PC, this.IR, this.Acc, this.Xreg, this.Yreg, this.Zflag];
        }

        private convfromHex(value){
             return parseInt(value.toString(), 16);
        }

        //If this errors then there is an error in the code
        private returnSegmentFromMemory(byte){

            let temp = -1;

            switch(byte){
                case "00":
                    temp = 0;
                    break
                case "01":
                    temp = 1;
                    break
                case "02":
                    temp = 2;
                    break
                default:
                    return -1;
            }

            //If false that means it is in use which is good
            if(!_MemoryManager.avaliableMemory[temp]){
                return temp;
            }
            return -1;
        }
    }
}