window.DCMParser = function(){
    var parser = {};

    parser.$init = function(byteArray){
        try {
            this.dataSet = dicomParser.parseDicom(byteArray);
            return parser;
        }catch(err){
            console.log(err);
            return null;
        }
    };

    parser.$initWithFile = function(file,complete){
        var reader = new FileReader();
        reader.onload = function(file) {
            var arrayBuffer = reader.result;
            // Here we have the file data as an ArrayBuffer.  dicomParser requires as input a
            // Uint8Array so we create that here
            var byteArray = new Uint8Array(arrayBuffer);
            complete(parser.$init(byteArray));
        };
        reader.readAsArrayBuffer(file);
    };

    parser.getString = function(key){
        var str = this.dataSet.string(key);
        if(str === undefined){
            return ""
        }else{
            return str;
        }
    }

    //Patient
    parser.$SOPClassUID = function(){
        return parser.getString("x00080016");
    };
    parser.$PatientId = function(){
        return parser.getString('x00100020');
    };
    parser.$PatientName = function(){
        return parser.getString('x00100010');
    };
    parser.$PatientBirthDay = function(){
        return parser.getString('x00100030');
    };

    //Study
    parser.$StudyInstanceUID = function(){
        return parser.getString("x0020000d");
    };
    parser.$StudyDescription = function(){
        return parser.getString('x00081030');
    };
    parser.$AccessionNumber = function(){
        return parser.getString('x00080050');
    };
    parser.$InstitutionName = function(){
        return parser.getString('x00080080');
    };
    parser.$ReferringPhysicianName = function(){
        return parser.getString('x00321032');
    };
    parser.$RequestedProcedureDescription = function(){
        return parser.getString('x00321060');
    };
    parser.$RequestingPhysician = function(){
        return parser.getString('x00321032');
    };
    parser.$StudyID = function(){
        return parser.getString('x00200010');
    };
    parser.$StudyDate = function(){
        return parser.getString('x00080020');
    };

    //Series
    parser.$SeriesInstanceUID = function(){
        return parser.getString("x0020000e");
    };
    parser.$SeriesDescription = function(){
        return parser.getString("x0008103e");
    };
    parser.$ContrastBolusAgent = function(){
        return parser.getString('x00180010');
    };
    parser.$Modality = function(){
        return parser.getString('x00080060');
    };
    parser.$OperatorsName = function(){
        return parser.getString('x00081070');
    };
    parser.$PerformedProcedureStepDescription = function(){
        return parser.getString('x00400254');
    };
    parser.$ProtocolName = function(){
        return parser.getString('x00181030');
    };
    parser.$SequenceName = function(){
        return parser.getString('x00180024');
    };
    parser.$SeriesNumber = function(){
        return parser.getString('x00200011');
    };
    parser.$StationName = function(){
        return parser.getString('x00081010');
    };

    //Instance
    parser.$SOPInstanceUID = function(){
        return parser.getString("x00080018");
    };
    parser.$InstanceNumber = function(){
        return parser.getString("x00200013");
    };
    parser.$NumberOfFrames = function(){
        var numberOfFrames = this.dataSet.string("x00280008");
        if(numberOfFrames === undefined){
            return ""
        }else{
            return numberOfFrames;
        }
    };


    

    
    

    return parser;
};

