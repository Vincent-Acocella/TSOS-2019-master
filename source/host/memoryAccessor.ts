module TSOS{
    export class MemoryAccessor{
        public progInMem = -1;
        public currentSegment = 1;
        constructor() {
        }

        init(){
             _Memory.init();
        }

        //Edit this function 
        //important
        public write(code: string){
            _MemoryManager.stationaryThread[_Memory.endIndex] = code;
            if(_Memory.endIndex !== 256) {
                _Memory.endIndex++;
                return true;
            }else{
                return false;
            }
        }

        public getNextAvaliableMemSeg(){
            if(_Memory.memoryThread1[0] == "00"){
                return 1;
            }else if(_Memory.memoryThread2[0] == "00"){
                return 2;
            }else if(_Memory.memoryThread3[0] == "00"){
                return 3;
            }else{
                return -1;
            }
        }

        public segmentsInUse(){
            //Array of 0s and 1s 

        }
    }
}