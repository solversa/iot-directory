myFile=null;
tableFirstLoad=true;
fileData=[];
editDeviceConditionsArray=[];
modelsdata=[];
receivedData=[];
var dataTable ="";
requiredHeaders=["name", "devicetype", "macaddress", "frequency", "kind", "protocol", "format", "producer", /*"edge_gateway_type", "edge_gateway_uri",  commented by Sara*/ "latitude", "longitude", "value_name", "data_type", "value_type", "editable", "value_unit", "healthiness_criteria", "healthiness_value", "k1", "k2"];

var gb_datatypes ="";
var gb_value_units ="";
var gb_value_types = "";
var defaultPolicyValue = [];
// var mynewAttributes = [];

var ifPages = [];

var gb_options = [];

var gb_device ="";
var gb_latitude ="";
var gb_longitude = "";
var gb_key1;
var gb_key2;

var gb_old_id="";
var gb_old_cb="";

var timerID= undefined;
var was_processing=0;


//--------to get the drop-down menus items----------// 

$.ajax({url: "../api/bulkDeviceLoad.php",
         data: {
			 action: 'get_param_values',
			 organization:organization
			 },
         type: "POST",
         async: true,
         dataType: 'json',
         success: function (mydata)
         {
		   gb_datatypes= mydata["data_type"];
		   gb_value_units= mydata["value_unit"];
		   gb_value_types= mydata["value_type"];	
           console.log(mydata);
         },
		 error: function (mydata)
		 {
		   console.log(JSON.stringify(mydata));
		   alert("Network errors. <br/> Get in touch with the Snap4City Administrator<br/>"+ JSON.stringify(mydata));
		 }
});


//--------to get the models with their details----------------------//

$.ajax({
                url: "../api/model.php",
                //data: mydata,
				data: {
					  action: "get_all_models",
                    organization:organization,
                    username: loggedUser,
                    loggedrole:loggedRole,
                    token: sessionToken,
				  },
                type: "POST",
                async: true,
                datatype: 'json',
                success: function (data)
                {
					modelsdata = data["content"];
                    console.log(modelsdata);
                }});

//--------------------Ajax call function to upload file data---------------------//
//sara 1510 start
function sendJsonToDb(jsondata){    
    var progress_modal = document.getElementById('myModal');
    var span = document.getElementsByClassName("close")[0];
    var spin = document.getElementById("loader_spin");
    var progress_ok=document.getElementById('progress_ok');
    /*progress_modal.style.display = "block";
    spin.style.display="block";
    progress_ok.style.display="none";
	//sara2310 start 
	user_message="Uploading your data...";
	document.getElementById('myModalBody').innerHTML= "<p>"+user_message+"</p>";
	//Sara2310 end  
	*/
    var jsondataPiece=jsondata;
    var more= false;
    
    if(jsondata.length >100){
        jsondataPiece= jsondata.slice(0,100);
        jsondata=jsondata.slice(100,jsondata.length);
        more=true;
    }
    
	$.ajax({
			 url: "../api/bulkDeviceLoad.php",
			 data:{
				  action: "insert",  
				  username: loggedUser,
				  jsondata: JSON.stringify(jsondataPiece),
				  token: sessionToken,
                 organization:organization
				 },
			 type: "POST",
			 async: true,//ATTENTION
			 dataType: "JSON",
			 timeout: 0,//ATTENTION- itr was 2000, do we really need it?
			 success: function (mydata) 
			 {
				var user_message_old= document.getElementById('myModalBody').innerHTML;
				
                 if (mydata['content'] != undefined){
				 	var content = mydata['content'];
										console.log("Success "+ JSON.stringify(content));

					content = content[0];
					
					if(content==undefined){
                        user_message_old= document.getElementById('myModalBody').innerHTML;
                        document.getElementById('myModalBody').innerHTML= user_message_old+"No device is inserted";

                    }
                    else{
						var user_message="";
						console.log("msg "+mydata["msg"]);
						console.log("content "+content.inserted);
						for(var i = 0; i < content.length; i++){
						   console.log("for i "+i+" length "+content[i].inserted);

							if(content[i].inserted=='ok'){
								//Sara2210 start
								/*user_message="Device: "+content[i].device+" on context broker "+ content[i].cb +" has "+content[i].valuesOk + " valid attributes and " + content[i].valuesKo + " invalid." 
								+ " Correctly uploaded;";*/
								if(content[i].duplicated != undefined){
									user_message="Device: "+content[i].device+" on context broker "+ content[i].cb +" correctly uploaded, "+content[i].duplicated + " attribute is duplicated, only one inserted;";									
								}
								else{
									user_message="Device: "+content[i].device+" on context broker "+ content[i].cb +" correctly uploaded;";
								}							//Sara2210 end
								user_message_old= document.getElementById('myModalBody').innerHTML;			
							}
							else if(content[i].inserted=='ko'){
								//user_message="Device: "+content[i].device+" on context broker "+ content[i].cb + " not inserted. ";
								user_message = "</br>"+mydata["msg"] + "</br>";
								user_message_old= "";//document.getElementById('myModalBody').innerHTML;			

							}

							document.getElementById('myModalBody').innerHTML= user_message_old+"<p>"+user_message+"</p>";

							
						}

					}
				}
				else{
					user_message= mydata["msg"];
					document.getElementById('myModalBody').innerHTML= user_message_old+"<p>"+user_message+"</p>";
				
				}
			},
			 error: function (mydata)
			{
				var user_message_old= document.getElementById('myModalBody').innerHTML;
				var user_message=mydata.msg;
				
				
				document.getElementById('myModalBody').innerHTML= user_message_old+"<p> No device is inserted </p>";
				console.log("Error inserting device " +mydata["msg"]);  
				console.log("Error status -- Ko result: " + JSON.stringify(mydata));
				
				
			 },
        complete: function()
        {
            
            if(more){
                setTimeout(function(){
                    sendJsonToDb(jsondata);
                    }, 500);
            }
            else{
                //ATTENTION: REMOVE THIS TIMEOUT, it is for testing purspose only, to show the loader
							setTimeout(function(){
								console.log("now I reload");
								//progress_modal.style.display = "none";
                                var user_message_old= document.getElementById('myModalBody').innerHTML;
                                user_message_old= user_message_old.replace("Uploading your data...",""); 
                                document.getElementById('myModalBody').innerHTML=user_message_old;
								progress_ok.style.display="block";
								spin.style.display="none";

								//location.reload(); //ATTENTION- refresh page after finishing uploading the file
							},1000); 
            }
        }
		
		});
			// console.log("iteration count "+iterationcount);

}
//sara 1510 end

function uploadDealcsv () {}; 

  /*------ Method for read uploded csv file ------*/
  uploadDealcsv.prototype.getCsv = function(e) {
       
      console.log($('#dealCsv'));
      
      $('#dealCsv').change( function() {

        if (this.files && this.files[0]) {

            myFile = this.files[0];
            
            console.log("here en");
            console.log(myFile.name);
            console.log(document.getElementById("labelinputFile").value);
            
            var extension= myFile.name.split('.').pop();
            console.log(extension);
            if(extension != "csv"){
                myFile=undefined;
                alert("please insert a CSV file");
            }
            else{
                 document.getElementById("labelinputFile").value =myFile.name;
            }
        }
      });
    }
  
  $('#uploadbutton').click( function(){
      
     console.log("clicked");
    
      if(myFile!=null){
          
          var reader = new FileReader();
          reader.addEventListener('load', function (e) {
                
                let csvdata = e.target.result; 
                parseCsv.getParsecsvdata(csvdata); // calling function for parse csv data 
                //buildMainTable(true);
            });
            
            reader.readAsBinaryString(myFile);
      }
      
      else{
          alert("Select a file first"); 
      }
      
      
  });
  
  
    uploadDealcsv.prototype.getParsecsvdata = function(data) {

        let parsedata = [];
		
		
		console.log("data before transform ");
		console.log(data);
		var data2 = data;
		
		try{
		data= utf8decode(data2);
		}
		catch{
		data= data2;
		}
		console.log("data after transform");
        console.log(data);


        let newLinebrk = data.split("\n");
                console.log(" new line brik "+newLinebrk.length);

        for(let i = 0; i < newLinebrk.length; i++) {

            line= newLinebrk[i].trim();
            line= line.replace(";",",");
            line= line.replace("\t",",");
            console.log(line.length);
            if(line.length>0){
                parsedata.push(line.split(","));
            }
            
            //parsedata.push(newLinebrk[i].split(","));
        }

        console.table(parsedata);

        //data transformation to JSON
        
        jsondata = csvJSON(data);
		//Sara2910 
		if(jsondata.length == 0){
			alert("Your file is empty");
		}
        if(jsondata!=undefined /*Sara2910 */ && jsondata.length != 0){
            
                console.log(jsondata);
                fileData=jsondata;

                valuesData=[];
                devicesData=[];

                for (var i=0; i<fileData.length; i++) {
                        jElement=fileData[i];
                        jElement=fileData[i];
                        var existsIndevices=0;
                        
                          if(jElement.editable.toLowerCase()=="true"){ //0910Fatima
                             jElement.editable="1";
                        }
                        else if(jElement.editable.toLowerCase()=="false"){//0910Fatima
                            jElement.editable="0";
                        }
                        
                        for (var j=0; j< devicesData.length; j++){
                            d = devicesData[j];


                            if (d.name == jElement.name){
                                console.log("here vv");
                                existsIndevices=1;
                                var deviceValues=d.deviceValues;
                                var vld={"value_name":jElement.value_name,"data_type":jElement.data_type,"value_type":jElement.value_type,"editable":jElement.editable,"value_unit":jElement.value_unit,"healthiness_criteria":jElement.healthiness_criteria,"healthiness_value":jElement.healthiness_value};
                                deviceValues.push(vld);
                                d.deviceValues=deviceValues;
                            }
                        }

                        if(existsIndevices==0){
                            var vd= {"name":jElement.name, "devicetype":jElement.devicetype, "macaddress":jElement.macaddress, "frequency":jElement.frequency, "kind":jElement.kind, "protocol":jElement.protocol ,"format":jElement.format, "producer":jElement.producer, /*"edge_gateway_type":jElement.edge_gateway_type, "edge_gateway_uri":jElement.edge_gateway_uri, commented by Sara*/"latitude":jElement.latitude ,"longitude":jElement.longitude , "validity_msg":jElement.validity_msg,"k1":jElement.k1, "k2":jElement.k2, "deviceValues":[{"value_name":jElement.value_name, "data_type":jElement.data_type, "value_type":jElement.value_type, "editable":jElement.editable, "value_unit":jElement.value_unit, "healthiness_criteria":jElement.healthiness_criteria ,"healthiness_value":jElement.healthiness_value}]};

                            devicesData.push(vd);
                        }

                         var vlv= {"name":jElement.name,"value_name":jElement.value_name,"data_type":jElement.data_type,"value_type":jElement.value_type,"editable":jElement.editable,"value_unit":jElement.value_unit,"healthiness_criteria":jElement.healthiness_criteria,"healthiness_value":jElement.healthiness_value};
                                valuesData.push(vlv);
                        }    

                fileData=devicesData;
                contextbroker= $('#selectContextBrokerLD').val();
                selectedModel="custom";
                if($('#selectModelLD').val() != undefined && $('#selectModelLD').val().length>1){
                    selectedModel= $('#selectModelLD').val();
                }
                else{
                    selectedModel="custom";
                }
                edgegatewaytype=$('#selectGatewayTypeLD').val();
                edgegatewayuri=$('#gatewayUri').val();
				
				console.log("edgegatewaytype received from form is");
				console.log(edgegatewaytype);
            

                console.log(contextbroker);
                console.log(selectedModel);

                for( var i=0; i<fileData.length; i++){

                    fileData[i]['contextbroker']=contextbroker;
                    fileData[i]['model']=selectedModel;
                    fileData[i]['edge_gateway_type']=edgegatewaytype;
					fileData[i]['edge_gateway_uri']=edgegatewayuri;
					
					console.log("edgegatewaytype");
					console.log(edgegatewaytype);
					/*
                    if(edgegatewaytype!=undefined && edgegatewaytype.length>1){
                        fileData[i]['edge_gateway_type']=edgegatewaytype;
                    }
                    if(edgegatewayuri!=undefined && edgegatewayuri.length>1){
                        fileData[i]['edge_gateway_uri']=edgegatewayuri;
                    }*/
                   
                    var fd= fileData[i];
                    var verification= verifyDevice(fd);
                    if(verification.isvalid){
                        fileData[i]['status']='valid';
                        fileData[i]['validity_msg']=verification.message;
                    }
                    else{
                        fileData[i]['status']='invalid';
                        fileData[i]['validity_msg']=verification.message;
                    }
					
					console.log("edgegatewaytype sent with Json ");
					console.log(fileData[i]['edge_gateway_type']);
                }
                console.log("after validationnn");
                console.log(fileData);
				
				

                // HERE THE UPLOAD TO THE SERVER of FILEDATA
            var progress_modal = document.getElementById('myModal');
            var span = document.getElementsByClassName("close")[0];
            var spin = document.getElementById("loader_spin");
            var progress_ok=document.getElementById('progress_ok');
            progress_modal.style.display = "block";
            spin.style.display="block";
            progress_ok.style.display="none";
            user_message="Uploading your data...";
            document.getElementById('myModalBody').innerHTML= "<p>"+user_message+"</p>";     
            
            sendJsonToDb(fileData);
    
        }
    }

  
  var parseCsv = new uploadDealcsv();
  parseCsv.getCsv();

    //var csv is the CSV file with headers
    function csvJSON(csv){

      
        var lines=csv.split("\n");
        var result = [];
      
        var headers=lines[0].split(",");
    
        var h_check=checkHeadersIfValid(headers);
        
        console.log("headers");
        console.log(headers);
        console.log(h_check);
        
        if(!h_check.isValid){
            alert(h_check.msg);
            return;
        }
        headers=h_check.headers;

      for(var i=1;i<lines.length;i++){

          var obj = {};
          var line= lines[i].trim();
          line= line.replace(";",",");
          line= line.replace("\\t",",");
          
          var currentline=line.split(",");
          
          if(currentline.length==1 && currentline[0]==""){
              continue;
          }
		  
		  if(currentline.length!=headers.length){
              alert("There is an error in the number of fields in row number "+(i+1) );
              return;
          }

          for(var j=0;j<headers.length;j++){
              if(requiredHeaders.indexOf(headers[j])>-1){
                  obj[headers[j]] = currentline[j].trim().replace('"','');
              }
              
              
          }
          
          //Fatima: I had to do this trick, because the last column header in the cvs file is
          //received for example as "k2\r" and this causes a problem, because it will be as "k2" in json 
          //instead of just k2
          
          var objString=JSON.stringify(obj).replace("\\r","");
          obj=JSON.parse(objString);
        
          console.log(obj);
          result.push(obj);

      }
        console.log(result);

      return result; //JavaScript object
      //return JSON.stringify(result); //JSON
    }

//-----------------------UPload the temp-devices-----------------------------//


//-----------------------------------------------------------------------------//

/*************Table related ****************/


function updateDeviceTimeout()
        {
            $("#editDeviceOkModal").modal('hide');
            setTimeout(function(){
			location.reload();
            }, 1000);
        }
//---------------build the table-----------------------------//


  function format ( d ) {
		
	// `d` is the original data object for the row
  	return '<div class="container-fluid">' +
		
		'<div class="row">' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>Kind:</b>' + "  " + d.kind + '</div>' +	
			'<div class="clearfix visible-xs"></div>' +
            '<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>Visibility:</b>' + "  " + d.visibility + '</div>' +				
		'</div>' +
		'<div class="row">' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#E6E6FA;"><b>Device Type:</b>' + "  " + d.devicetype + '</div>' +
			'<div class="clearfix visible-xs"></div>' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#E6E6FA;"><b>Format:</b>' + "  " + d.format + '</div>' +
		'</div>' + 
		'<div class="row">' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>Protocol:</b>' + "  " + d.protocol + '</div>' +
			'<div class="clearfix visible-xs"></div>' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>MAC:</b>' + "  " + d.macaddress + '</div>' +	
		'</div>' +
		'<div class="row">' +											
			'<div class="col-xs-6 col-sm-6" style="background-color:#E6E6FA;"><b>Model:</b>' + "  " + d.model + '</div>' +
			'<div class="clearfix visible-xs"></div>' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#E6E6FA;"><b>Producer:</b>' + "  " + d.producer + '</div>' +
		'</div>' + 
		'<div class="row">' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>Longitude:</b>' + "  " + d.longitude + '</div>' +
			'<div class="clearfix visible-xs"></div>' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>Latitude:</b>' + "  " + d.latitude  + '</div>' +
		'</div>' +                              
		'<div class="row">' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#E6E6FA;"><b>Gateway/Edge Type:</b>' + "  " + d.edge_gateway_type + '</div>' +
			'<div class="clearfix visible-xs"></div>' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#E6E6FA;"><b>Gateway/Edge Uri:</b>' + "  " + d.edge_gateway_uri  + '</div>' +	
		'</div>' +
		'<div class="row">' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>K1:</b>' + "  " + d.k1 + '</div>' +
			'<div class="clearfix visible-xs"></div>' +
			'<div class="col-xs-6 col-sm-6" style="background-color:#D6CADD;"><b>K2:</b>' + "  " + d.k2  + '</div>' +	
		'</div>' + 
	'</div>' ;
	
}


function fetch_data(destroyOld, selected=null)
        {
			console.log("usernametoDebug "+loggedUser);
         
		 //data=[];
            
            if(destroyOld)
            {
				$('#devicesTable').DataTable().destroy();
                tableFirstLoad = true;
				
            }  
			
			if (selected==null)
			{
			  mydata = {action: "get_temporary_devices", username: loggedUser,organization:organization, no_columns: ["position","edit","delete","map"]}; 
			}
			
            
	  dataTable = $('#devicesTable').DataTable({
		"processing" : true,
		"serverSide" : true,
		"lengthMenu" :[[5,25,50,100,-1],[5,25,50,100,"All"]],
		"pageLength":5,
		//"responsive" : true,
		"responsive": {
        details: false
		},
		"paging"   : true,
		"ajax" : {
		 url:"../api/bulkDeviceLoad.php",
		 data: mydata,
		//token : sessionToken,
		 datatype: 'json',
		 type: "POST",                
		},
  	 "columns": [
          {
			"class":          "details-control",
			"name": "position",
			"orderable":      false,
			"data":           null,
			"defaultContent": "",
			"render": function () {
					 return '<i class="fa fa-plus-square" aria-hidden="true"></i>';
				 },
			width:"15px"
            }, 	
			{"name": "id", "data": function ( row, type, val, meta ) {
			
				return row.name;
				} },			
			{"name": "contextbroker", "data": function ( row, type, val, meta ) {
				  return row.contextbroker;
				} },	
			{"name": "protocol", "data": function ( row, type, val, meta ) {
			
				  return row.protocol;
				} },
			{"name": "format", "data": function ( row, type, val, meta ) {
			
				  return row.format;
				} },
			{"name": "devicetype", "data": function ( row, type, val, meta ) {
			
				  return row.devicetype;
				} },
	
			{"name": "status", "data": function ( row, type, val, meta ) {
			
				 if (row.status=='invalid'){   
					//console.log(row.validity_msg);
					return '<button type="button" id="invalid" class="btn btn-warning" onclick="showValidityMsg(\''+ row.status + '\',\'' + row.validity_msg + '\')\">Invalid</button>';																				
					} 
				else if (row.status=='valid'){
					return '<button type="button" id="valid"  class="btn btn-success" onclick="showValidityMsg(\''+ row.status + '\',\'' + row.validity_msg + '\')\">Valid</button>';
					} 
				} },	
			{
                data: null,
				"name": "edit",
				"orderable":false,
                className: "center",
				render: function(d) {
                //defaultContent: '<button type="button" id="edit" class="editDashBtn data-id="'+ row.name +'"">Edit</button>'
				return '<button type="button" class="editDashBtn" ' +
				'data-id="'+d.name+'" ' +
				'data-contextBroker="'+d.contextbroker+'" ' +
				'data-kind="'+d.kind+'" ' +
				'data-model="'+d.model+'" ' +
				'data-devicetype="'+d.devicetype+'" ' +
				'data-uri="'+d.uri+'" ' +
				'data-visibility="'+d.visibility+'" ' +
				'data-frequency="'+d.frequency+'" ' +
				'data-format="'+d.format+'" ' +
				'data-ownership="'+d.ownership+'" ' +
				'data-protocol="'+d.protocol+'" ' +
				'data-macaddress="'+d.macaddress+'" ' +
				'data-producer="'+d.producer+'" ' +
				'data-longitude="'+d.longitude+'" ' +
				'data-latitude="'+d.latitude+'" ' +
				'data-edge_gateway_type="'+d.edge_gateway_type+'" ' +
				'data-edge_gateway_uri="'+d.edge_gateway_uri+'" ' +
				'data-k1="'+d.k1+'" ' +
				'data-k2="'+d.k2+'" ' +
				'data-attributes="'+d.attributes+'" ' +
				'data-status="'+d.status+'">Edit</button>';
				
				}
            },
			{
                data: null,
				"name": "delete",
				"orderable":      false,
                className: "center",
                //defaultContent: '<button type="button" id="delete" class="delDashBtn delete">Delete</button>'
				render: function(d) {
				return '<button type="button" class="delDashBtn" ' +
				'data-id="'+d.name+'" ' +
				'data-contextBroker="'+d.contextbroker+'" ' +
                'data-status="'+d.status+'" ' +
				'data-uri="'+d.uri+'">Delete</button>';
				}
            },
			{
                data: null,
				"name": "map",
				"orderable":      false,
                className: "center",
                //defaultContent: '<button type="button" id="map" class="delDashBtn delete">Location</button>'
				render: function(d) {
				return '<div class="addMapBtn"><i  data-toggle="modal" data-target="#addMapShow" onclick="drawMap(\''+ d.latitude + '\',\'' + d.longitude + '\', \'' + d.id + '\', \'' + d.devicetype + '\', \'' + d.kind + '\', \'' + 'addDeviceMapModalBodyShow' + '\')\" class="fa fa-globe"  style=\"font-size:36px; color: #0000ff\"></i></div>';
				}
            }
        ],  
    "order" : [] 
	  
   });
  
  }	 

 //end of fetch function 
	
     

$(document).ready(function () 
    {
	checkBulkStatus();	
//fetch_data function will load the device table 	
	fetch_data(false);	
	$.ajax({
                url: "../api/value.php",
                data:{
                                          
                    action: "get_cb",
                    token : sessionToken, 
                    username: loggedUser, 
                    organization : organization, 
                    loggedrole:loggedRole                          
                },
                type: "POST",
                async: true,
                success: function (data)
                {
                        
                    if (data["status"] === 'ok')
                    {        
                        var $dropdown = $("#selectContextBrokerLD");        
                        $dropdown.empty();
                        $.each(data['content_cb'], function() {
                            $dropdown.append($("<option />").val(this.name).text(this.name));        
                        });
                        
                        
                        var $dropdown = $("#selectModelLD");        
                        $dropdown.empty();
                        $dropdown.append($("<option />").val("custom").text("custom"));
                        $.each(data['content_model'], function() {
                            $dropdown.append($("<option />").val(this.name).text(this.name));        
                        });
                        
                        }
                    else{
                        console.log("error getting the context brokers and models "+data); 
                    }
                },
                error: function (data)
                {
                 console.log("error in the call to get the context brokers and models "+data);   
                }
          });	
//detail control for device dataTable
	var detailRows = [];
  	
	$('#devicesTable tbody').on('click', 'td.details-control', function () {
    var tr = $(this).closest('tr');
	var tdi = tr.find("i.fa");
    var row = dataTable.row( tr );
 
    if ( row.child.isShown() ) {
		// This row is already open - close it
        row.child.hide();
        tr.removeClass('shown');
		tdi.first().removeClass('fa-minus-square');
        tdi.first().addClass('fa-plus-square');
		}
    else {
		 // Open this row
        row.child( format(row.data()) ).show();

        tr.addClass('shown');
		tdi.first().removeClass('fa-plus-square');
        tdi.first().addClass('fa-minus-square');
		}
	});


//end of detail control for device dataTable 

  
  
//Start Related to Delete Device
	
		// Delete lines related to attributes 
	$("#attrNameDelbtn").off("click");
	$("#attrNameDelbtn").on("click", function(){
		console.log("#attrNameDelbtn");	
		$(this).parent('tr').remove();
		});	
		
		//Delete device button 
		
	$('#devicesTable tbody').on('click', 'button.delDashBtn', function () {
				console.log($(this));

		var id = $(this).attr('data-id');
		var contextbroker = $(this).attr('data-contextbroker');
		var uri = $(this).attr("data-uri");
        var status = $(this).attr("data-status");

		$("#deleteDeviceModal div.modal-body").html('<div class="modalBodyInnerDiv"><span data-id = "' + id + '" data-contextbroker = "' + contextbroker + '" data-status = "' + status+ '"  data-uri ="' + uri +'">Do you want to confirm deletion of device <b>' + id + '</b>?</span></div>');
		$("#deleteDeviceModal").modal('show');
	});

		//Delete button hover - needs to be checked
	$('#devicesTable tbody').on('hover', 'button.delDashBtn', function () {
	//$('#devicesTable button.delDashBtn').off('hover');
	//$('#devicesTable button.delDashBtn').hover(function(){
		console.log($(this));
		$(this).css('background', '#ffcc00');
		$(this).parents('tr').find('td').eq(1).css('background', '#ffcc00');
	}, 
	function(){
		$(this).css('background', '#e37777');
		$(this).parents('tr').find('td').eq(1).css('background', $(this).parents('td').css('background'));
	});
								
								
								
	
//End Related to Delete Device
  

// Device dataTable table Style 
  
	$('#devicesTable thead').css("background", "rgba(0, 162, 211, 1)");
	$('#devicesTable thead').css("color", "white");
	$('#devicesTable thead').css("font-size", "1em");
	
	
	$('#devicesTable tbody tr').each(function(){
		if((dataTable.row( this ).index())%2 !== 0)
		{
			$('#devicesTable tbody').css("background", "rgba(0, 162, 211, 1)");
			console.log( 'Row index: '+dataTable.row( this ).index() );
			$(this).find('td').eq(0).css("background-color", "rgb(230, 249, 255)");
			$(this).find('td').eq(0).css("border-top", "none");
		}
		else
		{
			$(this).find('td').eq(0).css("background-color", "white");
			$(this).find('td').eq(0).css("border-top", "none");
		}
	});

	/*$('#devicesTable tbody').on( 'click', 'tr', function () {
		alert( 'Row index: '+dataTable.row( this ).index() );
	});*/

	
//Display devices on the map 
	$('#displayDevicesMap').off('click');
	$('#displayDevicesMap').click(function(){
		$.ajax({
			url: "../api/device.php",
			data: {
				action: "get_all_device_latlong",
                organization:organization,
                loggedrole:loggedRole
				//token : sessionToken
			},
			type: "POST",
			async: true,
			datatype: 'json',
			success: function (data) 
			 {
				
				 if(data["status"] === 'ko')
					{
						  // data = data["content"];
						  alert("An error occured when reading the data. <br/> Get in touch with the Snap4City Administrator<br/>"+ data["msg"]);
					}

				 else (data["status"] === 'ok')
					{
						var data = data["content"];
						
						$("#addMap1").modal('show');
						drawMapAll(data, 'searchDeviceMapModalBody');
						}
			 },
			 error: function (data) 
			 {
				 console.log("Ko result: " + data);
				  alert("Network errors. <br/> Get in touch with the Snap4City Administrator<br/>"+ JSON.stringify(data));
			 }
			
		});		
	});
	//Titolo Default
	if (titolo_default != ""){
		$('#headerTitleCnt').text(titolo_default);
	}
	
	if (access_denied != ""){
		alert('You need to log in with the right credentials before to access to this page!');
	}
	
		///// SHOW FRAME PARAMETER USE/////
		if (nascondi == 'hide'){
			$('#mainMenuCnt').hide();
			$('#title_row').hide();
			$('#mainCnt').removeClass('col-md-10');
			$('#mainCnt').addClass('col-md-12');
		}
		//// SHOW FRAME PARAMETER  ////
		
		$('#sessionExpiringPopup').css("top", parseInt($('body').height() - $('#sessionExpiringPopup').height()) + "px");
        $('#sessionExpiringPopup').css("left", parseInt($('body').width() - $('#sessionExpiringPopup').width()) + "px");
        
        setInterval(function(){
            var now = parseInt(new Date().getTime() / 1000);
            var difference = sessionEndTime - now;
            
            if(difference === 300)
            {
                $('#sessionExpiringPopupTime').html("5 minutes");
                $('#sessionExpiringPopup').show();
                $('#sessionExpiringPopup').css("opacity", "1");
                setTimeout(function(){
                    $('#sessionExpiringPopup').css("opacity", "0");
                    setTimeout(function(){
                        $('#sessionExpiringPopup').hide();
                    }, 1000);
                }, 4000);
            }
            
            if(difference === 120)
            {
                $('#sessionExpiringPopupTime').html("2 minutes");
                $('#sessionExpiringPopup').show();
                $('#sessionExpiringPopup').css("opacity", "1");
                setTimeout(function(){
                    $('#sessionExpiringPopup').css("opacity", "0");
                    setTimeout(function(){
                        $('#sessionExpiringPopup').hide();
                    }, 1000);
                }, 4000);
            }
            
            if((difference > 0)&&(difference <= 60))
            {
                $('#sessionExpiringPopup').show();
                $('#sessionExpiringPopup').css("opacity", "1");
                $('#sessionExpiringPopupTime').html(difference + " seconds");
            }
            
            if(difference <= 0)
            {
                location.href = "logout.php?sessionExpired=true";
            }
        }, 1000);
        
        $('#mainContentCnt').height($('#mainMenuCnt').height() - $('#headerTitleCnt').height());
        
        $(window).resize(function(){
            $('#mainContentCnt').height($('#mainMenuCnt').height() - $('#headerTitleCnt').height());
            if($(window).width() < 992)
            {
                //$('#devicesTable').bootstrapTable('hideColumn', 'id');
                //$('#devicesTable').bootstrapTable('hideColumn', 'contextBroker');
                //$('#devicesTable').bootstrapTable('hideColumn', 'uri');
                //$('#devicesTable').bootstrapTable('hideColumn', 'protocol');
                //$('#devicesTable').bootstrapTable('hideColumn', 'format');
				//$('#devicesTable').bootstrapTable('hideColumn', 'devicetype');
				//$('#devicesTable').bootstrapTable('hideColumn', 'visibility');
				//$('#devicesTable').bootstrapTable('hideColumn', 'status1');
				
                //$('#devicesTable').bootstrapTable('hideColumn', 'type');
            
            }
            else
            {
                //$('#devicesTable').bootstrapTable('showColumn', 'id');
                //$('#devicesTable').bootstrapTable('showColumn', 'contextBroker');
				//$('#devicesTable').bootstrapTable('showColumn', 'devicetype');
				//$('#devicesTable').bootstrapTable('showColumn', 'visibility');
				//$('#devicesTable').bootstrapTable('showColumn', 'status1');
                //$('#devicesTable').bootstrapTable('showColumn', 'uri');
                //$('#devicesTable').bootstrapTable('showColumn', 'protocol');
                //$('#devicesTable').bootstrapTable('showColumn', 'format');
                //$('#devicesTable').bootstrapTable('showColumn', 'type');
           
            }
        });
		
		//$("#addMyNewDeviceRow").hide();
		
		for (var func =0;func < functionality.length; func++)
		{
		  var element = functionality[func];
		  if (element.view=="view")
		  {
			  if (element[loggedRole]==1)  
			   {   // console.log(loggedRole + " " + element[loggedRole] + " " + element["class"]); 
				   $(element["class"]).show();
			   }			   
			   else 
			   { 
				 $(element["class"]).hide();
				 // console.log($(element.class));
				//  console.log(loggedRole + " " + element[loggedRole] + " " + element["class"]);
			   }
			}   
		}
		
		
		$('#listDevicesLink .mainMenuItemCnt').addClass("mainMenuItemCntActive");
        $('#mobMainMenuPortraitCnt #listDevicesLink .mobMainMenuItemCnt').addClass("mainMenuItemCntActive");
        $('#mobMainMenuLandCnt #ListDevicesLink .mobMainMenuItemCnt').addClass("mainMenuItemCntActive");
    
    

        
    console.log("ok I am building the main table z");
   // buildMainTable(false);
	
$("#insertValidBtn").off("click");
	
	$('#insertValidBtn').click(function(){
	   insertValidDevices(); 
        
	   /* $.ajax({
			 url: "../api/bulkDeviceLoad.php",
			 data:{
				  action: "bulkload", 
				  username: loggedUser,
                 // start:start_index,
                 // end:end_index,
				  token : sessionToken
				 },
			 type: "POST",
			 async: true,
			 dataType: "text",
			 timeout: 0,
			 success: function (mydata) 
			 {
					console.log("mydata "+JSON.stringify(mydata));
					
             },
             error: function (mydata)
                {
                               
                    console.log("Error "+ JSON.stringify(mydata));

                 }
         });*/
	   
	/*var progress_modal = document.getElementById('myModal');
    var span = document.getElementsByClassName("close")[0];
    var spin = document.getElementById("loader_spin");
    var progress_ok=document.getElementById('progress_ok');
    document.getElementById('myModalBody').innerHTML= "Inserting the valid devices...";
    progress_modal.style.display = "block";
    spin.style.display="block";
    progress_ok.style.display="none";*/
    
		  
		/* $.ajax({
			 url: "../api/bulkDeviceLoad.php",
			 data:{
				  action: "get_count_temporary_devices", 
				  username: loggedUser,
				   token : sessionToken
				 },
			 type: "POST",
			 async: true,
			 dataType: "JSON",
			 timeout: 0,
			 success: function (mydata) 
			 {
				if (mydata['content'] != undefined){
				 	var content = mydata['content'];
					
					
				    console.log("Success "+ JSON.stringify(content));
				    console.log(typeof(parseInt(content)));
					if(typeof(parseInt(content))=="number"){
                            insertValidDevices(parseInt(content));
                        }
                    else{
                           //document.getElementById('myModalBody').innerHTML= "couldn't find any device to insert";
						   //progress_ok.style.display="block";
						   //spin.style.display="none"; 
                        }
					
				}
				else{
					//document.getElementById('myModalBody').innerHTML= "couldn't find any device to insert";
				    //progress_ok.style.display="block";
					//spin.style.display="none";				
				}
			 },
			 error: function (mydata)
			{
				console.log("Error "+ JSON.stringify(mydata));
				//document.getElementById('myModalBody').innerHTML= "couldn't find any device to insert";
                //progress_ok.style.display="block";
                //spin.style.display="none";
				
			 }
		
		});*/
	});

    $('#nodeJsTest').click(function(){
            nodeJsTest(); 
                });
        
		/*$("#addMyNewDevice").click(function() {
		
			console.log("add new device");	
			$("#displayAllDeviceRow").hide();
			$("#addMyNewDeviceRow").show();

			$('#inputNameDeviceUser').val("");
			$('#inputTypeDeviceUser').val("");
			$('#inputLatitudeDeviceUser').val("");
			$('#inputLongitudeDeviceUser').val("");
			drawMapUser(43.78, 11.23);
			// showAddDeviceModal();
			
				 
			
		});
		*/
		
		/*$("#allDevice").click(function() {
			
			$("#displayAllDeviceRow").show();
			// $("#addDeviceModal").modal('show');
			$("#addMyNewDeviceRow").hide();
		});
	
		$("#myDevice").click(function() {
			
		 $("#displayAllDeviceRow").show();
		// $("#addDeviceModal").modal('show');
		 $("#addMyNewDeviceRow").hide();
		 
		});
		*/
						
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			var target = $(e.target).attr("href");
			if ((target == '#addGeoPositionTabDevice')) {
				console.log("Elf: Add Device Map");
				var latitude = 43.78; 
				var longitude = 11.23;
				var flag = 0;
				drawMap1(latitude,longitude, flag);
			} else {//nothing
			}
		});


		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			var target = $(e.target).attr("href");
			if ((target == '#editGeoPositionTabDevice')) {
				console.log("Elf : EditDeviceMap");
					var latitude = $("#inputLatitudeDeviceM").val(); 
					var longitude = $("#inputLongitudeDeviceM").val();
					var flag = 1;
				drawMap1(latitude,longitude, flag);
			} else {//nothing
			}
		});
		
	
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
	var target = $(e.target).attr("href");
	if ((target == '#editStatusTabDevice')) {
		
		var id = document.getElementById('inputNameDeviceM').value;
		var contextbroker = document.getElementById('selectContextBrokerM').value;
		var type = document.getElementById('inputTypeDeviceM').value;
		var kind = document.getElementById('selectKindDeviceM').value;
		var latitude = document.getElementById('inputLatitudeDeviceM').value;
		var longitude = document.getElementById('inputLongitudeDeviceM').value;
		var protocol = document.getElementById('selectProtocolDeviceM').value;
		
	   if (id==null || id=="") { var idNote = ("\n id not specified");} else{idNote = "&#10004;";}
	   if (contextbroker==null || contextbroker=="") {var contextbrokerNote = ("cb not specified");} else{contextbrokerNote = "&#10004;";}
	   if (type==null || type=="") {var typeNote = ("type not specified");} else{typeNote = "&#10004;";}
	   if (!(kind=="sensor" || kind=="actuator")) {var kindNote = ("\n kind not specified");}  else{kindNote = "&#10004;";}
	   if ((latitude < -90 && latitude > 90) || (latitude=="" || latitude==null)) {var latitudeNote = ("\n latitude not correct ");} else{latitudeNote = "&#10004;";}
	   if ((longitude < -180 && longitude > 180) || (longitude=="" || longitude==null)) {var longitudeNote = ("\n longitude not correct ");} else{longitudeNote = "&#10004;";}
	   if (!(protocol=="ngsi" || protocol=="mqtt" || protocol=="amqp")) {var protocolNote = ("protocol not correct ");} else{protocolNote = "&#10004;";}
		
		console.log(id + contextbroker + type + kind + latitude + longitude + protocol);
	
			if ((idNote == "&#10004;") && (contextbrokerNote == "&#10004;") && (typeNote == "&#10004;") && (kindNote == "&#10004;") && (latitudeNote == "&#10004;") && (longitudeNote == "&#10004;") && (protocolNote == "&#10004;")){var statusNote = "<button class=\"btn btn-success btn-round\"></button>";} else{statusNote= "<button class=\"btn btn-danger btn-round\"></button>";}
		
		var x =inputPropertiesDeviceMMsg.innerHTML;
		
		var div = document.createElement("div");
		console.log("IPDMM:" + x);
		
		if (x =="&nbsp;"){
			}
		else{
			inputPropertiesDeviceMMsg.innerHTML="";
		}

		div.innerHTML = ("<div style=\"border:3px solid blue;\" >" +
		"<h2>Device Status</h2>" +
		"<table class=\"table\"><thead><tr><th>Property Status</th><th> checked</th></tr></thead>" +
		"<tbody><tr><td>id</td><td>" + idNote + "</td></tr>" +
		"<tr><td>Contextbroker</td><td>" + contextbrokerNote + "</td></tr>" +
		"<tr><td>Type</td><td>" + typeNote + "</td></tr>" +
		"<tr><td>Kind</td><td>" + kindNote +" </td></tr>" +
		"<tr><td>Protocol</td><td>" + protocolNote + "</td></tr>" +
		"<tr><td>Latitude</td><td>"+ latitudeNote +" </td></tr>" +
		"<tr><td>Longitude</td><td>"+ longitudeNote + "</td></tr>" +
		"<tr><td>Overall Status</td><td>"+ statusNote + "</td></tr>" +
		"</tbody></table></div>");
		inputPropertiesDeviceMMsg.appendChild(div);
		
		
		} 

		
	});			

/*
    $('#selectVisibilityDevice').click(function() {
	 var ownerSelect =  document.getElementById('selectVisibilityDevice').options;
	 var ownerOpt = document.getElementById('selectVisibilityDevice').selectedIndex;

	 var nameOpt =  document.getElementById('selectModelDevice').options;
	 var selectednameOpt = document.getElementById('selectModelDevice').selectedIndex;
	 
	 console.log("normal" +nameOpt[selectednameOpt].getAttribute("data_key") + nameOpt[selectednameOpt].value + ownerSelect[ownerOpt].value);
	 
	 if (nameOpt[selectednameOpt].getAttribute("data_key")=="normal" && ownerSelect[ownerOpt].value=='private'){
	
		$("#sigFoxDeviceUserMsg").val("");
	
		gb_key1 = generateUUID();
		gb_key2 = generateUUID();

		$("#KeyOneDeviceUserMsg").html("");
		$("#KeyTwoDeviceUserMsg").html("");
	
		$("#sigFoxDeviceUserMsg").html("These keys have been generated automatically for your device. Keep track of them. Details on <a href=\"https://www.snap4city.org/drupal/node/76\">info</a>");
	
		$("#KeyOneDeviceUser").val(gb_key1);
		$("#KeyTwoDeviceUser").val(gb_key2);
		console.log("normal" +nameOpt[selectednameOpt].getAttribute("data_key")+gb_key1+gb_key2);							 
								 
	}
	if (nameOpt[selectednameOpt].getAttribute("data_key")=="special" && ownerSelect[ownerOpt].value=='private')
	{
		$("#sigFoxDeviceUserMsg").html("Generate in your SigFox server the keys and report them here.  Details on <a href=\"https://www.snap4city.org/drupal/node/76\">info</a>");
		$("#KeyOneDeviceUser").val("");
		$("#KeyTwoDeviceUser").val("");
		console.log("special "+ nameOpt[selectednameOpt].getAttribute("data_key")+gb_key1+gb_key2);							 

		// UserKey();
	}
	if (ownerSelect[ownerOpt].value=='public')
	{
		$("#sigFoxDeviceUserMsg").html("");
		$("#KeyOneDeviceUser").val("");
		$("#KeyTwoDeviceUser").val("");
		
		// UserKey();
	}


	});
*/
	
    $("#selectModelDevice").click(function() {
			
      var nameOpt =  document.getElementById('selectModelDevice').options;
      var selectednameOpt = document.getElementById('selectModelDevice').selectedIndex;
	  var ownerSelect =  document.getElementById('selectVisibilityDevice').options;
	  var ownerOpt = document.getElementById('selectVisibilityDevice').selectedIndex;
 		
		//Fatima3	 
		//if ((nameOpt[selectednameOpt].value !="custom")&&(nameOpt[selectednameOpt].value !="")) 
     if (nameOpt[selectednameOpt].value !="") {
			
			 var gb_device =  document.getElementById('inputNameDevice').value;
			 var gb_latitude =  document.getElementById('inputLatitudeDevice').value;
			 var gb_longitude =  document.getElementById('inputLongitudeDevice').value;
			 
			 // $("#addDeviceModal #selectModelDevice").val(nameOpt[selectednameOpt].value);
         
         //Fatima6
         $("#KeyOneDeviceUser").removeAttr('disabled');
         $("#KeyOneDeviceUser").removeAttr('disabled');

         if(nameOpt[selectednameOpt].value.indexOf("Raspberry")!=-1 || nameOpt[selectednameOpt].value.indexOf("Arduino")!=-1 || nameOpt[selectednameOpt].value.indexOf("sigfox")!=-1 || nameOpt[selectednameOpt].value.indexOf("Sigfox")!=-1){
             
             $("#addNewDeviceGenerateKeyBtn").hide();
         }
         else{
             $("#addNewDeviceGenerateKeyBtn").show();
         }
         
         

	 if (nameOpt[selectednameOpt].getAttribute("data_key")=="normal" && ownerSelect[ownerOpt].value=='private'){
	
         //Fatima6 //Fatima3
         //$("#addNewDeviceGenerateKeyBtn").show();
         
         
	     if ($("#KeyOneDeviceUser").val()=="" || nameOpt[selectednameOpt].value.indexOf("Raspberry")!=-1 ||    nameOpt[selectednameOpt].value.indexOf("Arduino")!=-1  )
		 {	 
			$("#sigFoxDeviceUserMsg").val("");
		
			gb_key1 = generateUUID();
			gb_key2 = generateUUID();

			$("#KeyOneDeviceUserMsg").html("");
			$("#KeyTwoDeviceUserMsg").html("");
		
			$("#sigFoxDeviceUserMsg").html("These keys have been generated automatically for your device. Keep track of them. Details on <a href=\"https://www.snap4city.org/drupal/node/76\">info</a>");
		
			$("#KeyOneDeviceUser").val(gb_key1);
			$("#KeyTwoDeviceUser").val(gb_key2);
			console.log("normal" +nameOpt[selectednameOpt].getAttribute("data_key")+gb_key1+gb_key2);							 
         }								 
	}
	if (nameOpt[selectednameOpt].getAttribute("data_key")=="special" && ownerSelect[ownerOpt].value=='private')
	{
		//Fatima6 //Fatima3
        //$("#addNewDeviceGenerateKeyBtn").hide();
        
	     if ($("#KeyOneDeviceUser").val()=="")
		 {
			$("#sigFoxDeviceUserMsg").html("Generate in your SigFox server the keys and report them here.  Details on <a href=\"https://www.snap4city.org/drupal/node/76\">info</a>");
			$("#KeyOneDeviceUser").val("");
			$("#KeyTwoDeviceUser").val("");
			console.log("special "+ nameOpt[selectednameOpt].getAttribute("data_key")+gb_key1+gb_key2);							 
		 }
		// UserKey();
	}





			 
			 console.log(nameOpt[selectednameOpt].value + " " + gb_device + " " + gb_longitude + " " + gb_latitude);
			
         if(nameOpt[selectednameOpt].value !="custom"){ 
				$.ajax({
					url: "../api/model.php",
					data: {
					action: "get_model",
					name: nameOpt[selectednameOpt].value 
					},
					type: "POST",
					async: true,
					datatype: 'json',
					success: function (data) 
					 {
						
						 if(data["status"] === 'ko')
							{
								  // data = data["content"];
								  alert("An error occured when reading the data. <br/> Get in touch with the Snap4City Administrator<br/>"+ data["msg"]);
							}

						 else (data["status"] === 'ok')
							{					
								console.log("maroc" + data.content.attributes);
								
								var model = data.content.name;
								var type = data.content.devicetype;
								var kind = data.content.kind;
								var producer = data.content.producer;
								var mac = data.content.mac;
								var frequency = data.content.frequency;
								var contextbroker = data.content.contextbroker;
								var protocol = data.content.protocol;
								var format = data.content.format;
								var myattributes  = JSON.parse(data.content.attributes);
								var k =0;
								var content ="";
								// population of the value tab with the values taken from the db						
								while (k < myattributes.length)
								  {
									console.log(myattributes.length + " " +k); 
									content += drawAttributeMenu(myattributes[k].value_name, 
										 myattributes[k].data_type, myattributes[k].value_type, myattributes[k].editable, myattributes[k].value_unit, myattributes[k].healthiness_criteria, 
										 myattributes[k].healthiness_value, myattributes[k].old_value_name,
										 'addlistAttributes');
									k++;
								  }
								$('#addlistAttributes').html(content);
												
								$('#inputTypeDevice').val(data.content.devicetype);
								$('#selectKindDevice').val(data.content.kind);
								$('#inputProducerDevice').val(data.content.producer);
								$('#inputFrequencyDevice').val(data.content.frequency);
								$('#inputMacDevice').val(data.content.mac);
								$('#selectContextBroker').val(data.content.contextbroker);
								$('#selectProtocolDevice').val(data.content.protocol);
								$('#selectFormatDevice').val(data.content.format); 
								addDeviceConditionsArray['inputTypeDevice'] = true;
								checkDeviceType(); checkAddDeviceConditions();
								addDeviceConditionsArray['inputFrequencyDevice'] = true;
								checkFrequencyType(); checkAddDeviceConditions();
								

							}
					 },
					 error: function (data) 
					 {
						 console.log("Ko result: " + JSON.stringify(data));
						 $('#addlistAttributes').html("");
												
								$('#inputTypeDevice').val("");
								$('#selectKindDevice').val("");
								$('#inputProducerDevice').val("");
								$('#inputFrequencyDevice').val("");
								$('#inputMacDevice').val("");
								$('#selectContextBroker').val("");
								$('#selectProtocolDevice').val("");
								$('#selectFormatDevice').val("");
                                alert("An error occured when reading the information about model. <br/> Try again or get in touch with the Snap4City Administrator<br/>");

								// $("#addDeviceModal").modal('hide');								
					 }
					
				});		
             }
         
          //Fatima6
         if(nameOpt[selectednameOpt].value.indexOf("Raspberry")!=-1 || nameOpt[selectednameOpt].value.indexOf("Arduino")!=-1){
             
             $("#KeyOneDeviceUser").attr({'disabled': 'disabled'});
             $("#KeyTwoDeviceUser").attr({'disabled': 'disabled'});
         }
         else{
             $("#KeyOneDeviceUser").removeAttr('disabled');
             $("#KeyTwoDeviceUser").removeAttr('disabled');
         }
				
			/* 	
		
			  $("#addDeviceModal").modal('show');
			 // console.log(name);
			 // $("#addDeviceModalBody").modal('show');
			  $("#addDeviceLoadingMsg").hide();
			  $("#addDeviceLoadingIcon").hide();
			  $("#addDeviceOkMsg").hide();
			  $("#addDeviceOkIcon").hide();
			  $("#addDeviceKoMsg").hide();
			  $("#addDeviceKoIcon").hide();
			   */
		}
		else{
			$('#inputTypeDevice').val("");
			$('#selectKindDevice').val("");
			$('#inputProducerDevice').val("");
			$('#inputFrequencyDevice').val("");
			
			$('#inputMacDevice').val("");
			$('#selectContextBroker').val("");
			$('#selectProtocolDevice').val("");
			$('#selectFormatDevice').val(""); 
			gb_key1 = "";
		     gb_key2 = "";
			$('#KeyOneDeviceUserMsg').html("");
			$('#KeyTwoDeviceUserMsg').html("");
            $('#KeyOneDeviceUserMsg').val("");
			$('#KeyTwoDeviceUserMsg').val("");
		    // $('#addlistAttributes').html("");
			addDeviceConditionsArray['inputTypeDevice'] = false;
			checkDeviceType(); checkAddDeviceConditions();
			addDeviceConditionsArray['inputFrequencyDevice'] = false;
			checkFrequencyType(); checkAddDeviceConditions();

		} 		

		   });

//INSERT BULK DEVICES 

// add lines related to attributes			
	$("#addAttrBtn").off("click");
	$("#addAttrBtn").click(function(){
	   console.log("#addAttrBtn");							   
	   content = drawAttributeMenu("","", "", "", "", "", " "," ",  'addlistAttributes');
		// addDeviceConditionsArray['addlistAttributes'] = true;
	   //console.log("contenuto drawAttr" +content);
	   $('#addlistAttributes').append(content);
	});			
	
//DELETE DEVICE (DELETE FROM DB)  			
		
	// Delete lines related to attributes 

	$("#attrNameDelbtn").off("click");
	$("#attrNameDelbtn").on("click", function(){
		console.log("#attrNameDelbtn");	
		$(this).parent('tr').remove();
		});	
					
	 $('#devicesTable button.delDashBtn').off('click');
	 $('#devicesTable button.delDashBtn').click(function(){
		var id = $(this).attr('data-id');
		var contextBroker = $(this).attr("data-contextbroker");
		var uri = $(this).attr("data-uri");
		var status = $(this).attr("data-status");
		
		$("#deleteDeviceModal div.modal-body").html('<div class="modalBodyInnerDiv"><span data-id = "' + id + '" data-contextBroker = "' + contextBroker + '"  data-uri ="' + uri + '" data-status = "' + status+'">Do you want to confirm deletion of device <b>' + id + '</b>?</span></div>');
		$("#deleteDeviceModal").modal('show');
	});
								
		
	
        $('#deleteDeviceConfirmBtn').off("click");
        $("#deleteDeviceConfirmBtn").click(function(){
			
            var id = $("#deleteDeviceModal span").attr("data-id");
			var contextbroker = $("#deleteDeviceModal span").attr("data-contextbroker");
            var uri = $("#deleteDeviceModal span").attr("data-uri");
            var status = $("#deleteDeviceModal span").attr("data-status");
            console.log("valori val "+id +" "+contextbroker + " " + status);
	 
            $("#deleteDeviceModal div.modal-body").html("");
            $("#deleteDeviceCancelBtn").hide();
            $("#deleteDeviceConfirmBtn").hide();
            $("#deleteDeviceModal div.modal-body").append('<div id="deleteDeviceModalInnerDiv1" class="modalBodyInnerDiv"><h5>Device deletion in progress, please wait</h5></div>');
            $("#deleteDeviceModal div.modal-body").append('<div id="deleteDeviceModalInnerDiv2" class="modalBodyInnerDiv"><i class="fa fa-circle-o-notch fa-spin" style="font-size:36px"></i></div>');

            /*********Sara start - delete from json *****/
			var toDelete = {id: id, uri: uri, contextBroker: contextbroker, status: status};
			//deleteJSONvalues(toDelete);
            console.log("GOING TO DELETE ");
            console.log("id "+ id);
            console.log("status"+status);
			/****Sara end****/
            
            $.ajax({
                url: "../api/bulkDeviceLoad.php",
				data:{
					action: "delete_temporary",
					id: id, 
					uri : uri,
					//Sara2510 start
					username: loggedUser,
					//Sara2510 end
					contextbroker : contextbroker,
					token : sessionToken,
                    organization:organization
					},
                type: "POST",
				datatype: "json",
                async: true,
                success: function (data) 
                {
					console.log(JSON.stringify(data));
                    if(data["status"] === 'ko')
                    {
                        $("#deleteDeviceModalInnerDiv1").html(data["msg"]);
                        $("#deleteDeviceModalInnerDiv2").html('<i class="fa fa-frown-o" style="font-size:42px"></i>');
                    
					    setTimeout(function()
                        {  $("#deleteDeviceModal").modal('hide');  
                        }, 2000);
					}
                    else if(data["status"] === 'ok')
                    {
                        $("#deleteDeviceModalInnerDiv1").html('Device &nbsp; <b>' + id + '</b> &nbsp;deleted successfully');
                        $("#deleteDeviceModalInnerDiv2").html('<i class="fa fa-check" style="font-size:42px"></i>');
						
						console.log(status);
						if(status=='valid')
						$('#dashboardTotActiveCnt .pageSingleDataCnt').html(parseInt($('#dashboardTotActiveCnt .pageSingleDataCnt').html()) - 1);
						else          
						$('#dashboardTotPermCnt .pageSingleDataCnt').html(parseInt($('#dashboardTotPermCnt .pageSingleDataCnt').html()) - 1);
						  
						setTimeout(function()
                        {
                            fetch_data(true);							
                            $("#deleteDeviceModal").modal('hide');
							
                            setTimeout(function(){
                                $("#deleteDeviceCancelBtn").show();
                                $("#deleteDeviceConfirmBtn").show();
                            }, 500);
                        }, 2000);
                    }
                },
                error: function (data) 
                {
					console.log(JSON.stringify(data));
                    $("#deleteDeviceModalInnerDiv1").html(data["msg"]);
                    $("#deleteDeviceModalInnerDiv2").html('<i class="fa fa-frown-o" style="font-size:42px"></i>');
					setTimeout(function()
                        {  $("#deleteDeviceModal").modal('hide');  
                        }, 2000);
                }
            });
        });
        
//INSERT Valid



//END INSERT VALID
//DELETE ALL -- Sara
$("#deleteAllBtn").off("click");
	$("#deleteAllBtn").on("click", function(){

		$("#deleteAllDevModal div.modal-body").html('<div class="modalBodyInnerDiv">Do you want to confirm the deletion of ALL the devices?</div>');
		$("#deleteAllDevModal").modal('show');
	});
$('#deleteAllDevConfirmBtn').off("click");
        $("#deleteAllDevConfirmBtn").click(function(){
            $("#deleteAllDevModal div.modal-body").html("");
            $("#deleteAllDevCancelBtn").hide();
            $("#deleteAllDevConfirmBtn").hide();
            $("#deleteAllDevModal div.modal-body").append('<div id="deleteAllDevModalInnerDiv1" class="modalBodyInnerDiv"><h5>Deletion in progress, please wait</h5></div>');
            $("#deleteAllDevModal div.modal-body").append('<div id="deleteAllDevModalInnerDiv2" class="modalBodyInnerDiv"><i class="fa fa-circle-o-notch fa-spin" style="font-size:36px"></i></div>');
            
            $.ajax({
                url: "../api/bulkDeviceLoad.php",
				data:{
					action: "delete_all_temporary",
					username: loggedUser, 
					token : sessionToken,
                    organization:organization
					},
                type: "POST",
				datatype: "json",
                async: true,
                success: function (data) 
                {
					console.log(JSON.stringify(data));
                    if(data["status"] === 'ko')
                    {
                        $("#deleteAllDevModalInnerDiv1").html(data["msg"]);
                        $("#deleteAllDevModalInnerDiv2").html('<i class="fa fa-frown-o" style="font-size:42px"></i>');
                    
					    setTimeout(function()
                        {  $("#deleteAllDevModal").modal('hide');  
                        }, 2000);
					}
                    else if(data["status"] === 'ok')
                    {
                        $("#deleteAllDevModalInnerDiv1").html('Devices deleted successfully');
                        $("#deleteAllDevModalInnerDiv2").html('<i class="fa fa-check" style="font-size:42px"></i>');
						
						 
						
						$('#dashboardTotActiveCnt .pageSingleDataCnt').html(0);         
						$('#dashboardTotPermCnt .pageSingleDataCnt').html(0);

                        setTimeout(function()
                        {
                            fetch_data(true);	
                            $("#deleteAllDevModal").modal('hide');
							
                            setTimeout(function(){
                                $("#deleteAllDevCancelBtn").show();
                                $("#deleteAllDevConfirmBtn").show();
                            }, 500);
                        }, 2000);
                    }
                },
                error: function (data) 
                {
					console.log(JSON.stringify(data));
                    if(data["msg"]!=undefined){
                        $("#deleteAllDevModalInnerDiv1").html(data["msg"]);
                    }
                    else{
                        $("#deleteAllDevModalInnerDiv1").html("Nothing is deleted");
                    }
                        $("#deleteAllDevModalInnerDiv2").html('<i class="fa fa-frown-o" style="font-size:42px"></i>');
                        setTimeout(function()
                            {   $("#deleteAllDevModal").modal('hide');
								$("#deleteAllDevCancelBtn").show();
                                $("#deleteAllDevConfirmBtn").show();							
                            }, 2000);
                }
            });
        });
        					
//END DELETE ALL
// EDIT DEVICE   
		 
		 
// add lines related to attributes in case of edit
	$("#addAttrMBtn").off("click");
	$("#addAttrMBtn").click(function(){				
	   console.log("#addAttrMBtn");					
	   content = drawAttributeMenu("","", "", "", "", "", "300"," ",'addlistAttributesM');
		editDeviceConditionsArray['addlistAttributesM'] = true;
	   $('#addlistAttributesM').append(content);
	});	



$('#devicesTable tbody').on('click', 'button.editDashBtn', function () {
	$("#editDeviceModalBody").show();
	$('#editDeviceModalTabs').show();


	  $("#editDeviceLoadingMsg").hide();
	  $("#editDeviceLoadingIcon").hide();
	  $("#editDeviceOkMsg").hide();
	  $("#editDeviceOkIcon").hide();
	  $("#editDeviceKoMsg").hide();
	  $("#editDeviceKoIcon").hide(); 
	  $("#editDeviceModalFooter").show();
	  $("#editDeviceModalLabel").html("Edit device - " + $(this).attr("data-id"));
	  $("#editDeviceModal").modal('show');
	  
	   
	  var id = $(this).attr('data-id');
		gb_old_id = id;
	  var contextbroker = $(this).attr('data-contextbroker');
		gb_old_cb = contextbroker;
	  var type = $(this).attr('data-devicetype');
	  var kind =  $(this).attr('data-kind');
	  var uri =   $(this).attr('data-uri');
	  var protocol = $(this).attr('data-protocol');
	  var format = $(this).attr('data-format');
	  var macaddress = $(this).attr('data-macaddress');
	  var model = $(this).attr('data-model');
	  var producer = $(this).attr('data-producer');
	  var edge_gateway_type = $(this).attr('data-edge_gateway_type');
	  var edge_gateway_uri = $(this).attr('data-edge_gateway_uri');
	  var latitude = $(this).attr('data-latitude');
	  var longitude = $(this).attr('data-longitude');
	  var frequency = $(this).attr('data-frequency');
	  var visibility = $(this).attr('data-visibility');
	  
	  var key1 = $(this).attr('data-k1');
	  var key2 = $(this).attr('data-k2');
	  /* let's comment it now, we'll add it when we set the strategy to use 
      for keys with all models
      if (model == "custom")
		   $("#editDeviceGenerateKeyBtn").show();
	  else
		   $("#editDeviceGenerateKeyBtn").hide();	*/		  

	$("#editDeviceGenerateKeyBtn").show();
    $('#inputNameDeviceM').val(id);
	$('#selectContextBrokerM').val(contextbroker);
	$('#inputTypeDeviceM').val(type);
	$('#selectKindDeviceM').val(kind);
	$('#inputUriDeviceM').val(uri);
	$('#selectProtocolDeviceM').val(protocol);
	$('#selectFormatDeviceM').val(format);
	$('#createdDateDeviceM').val($(this).parents('tr').attr('data-created'));
	$('#inputMacDeviceM').val(macaddress);
	$('#selectModelDeviceM').val(model);
	$('#inputProducerDeviceM').val(producer);
	$('#selectEdgeGatewayTypeM').val(edge_gateway_type);
	$('#inputEdgeGatewayUriM').val(edge_gateway_uri);
	$('#inputLatitudeDeviceM').val(latitude);															  
	$('#inputLongitudeDeviceM').val(longitude);	
	$('#inputFrequencyDeviceM').val(frequency);
	$('#selectVisibilityDeviceM').val(visibility);
	  
	$('#KeyOneDeviceUserM').val(key1);
	$('#KeyTwoDeviceUserM').val(key2);
	  
	console.log('edge_gateway_type');  
	console.log(edge_gateway_type);  
	//showEditDeviceModal();  
	//sara -> could be a problem
	
    $.ajax({
                url: "../api/value.php",
                data:{
                                          
                    action: "get_cb",
                    token : sessionToken, 
                    username: loggedUser, 
                    organization : organization, 
                    loggedrole:loggedRole                          
                },
                type: "POST",
                async: true,
                success: function (data)
                {
                        
                    if (data["status"] === 'ok')
                    {        
                        var $dropdown = $("#selectContextBrokerM");        
                        $dropdown.empty();
                        $dropdown.append($("<option />").val(contextbroker).text(contextbroker));
                        $.each(data['content'], function() {
                            if(this.name != contextbroker)
                            $dropdown.append($("<option />").val(this.name).text(this.name));        
                        });
                        
                         $('#editDeviceModal').show();
				
                        }
                    else{
                        console.log("error getting the context brokers "+data); 
                    }
                },
                error: function (data)
                {
                 console.log("error in the call to get the context brokers "+data);   
                }
          });
    
   
    

	$.ajax({
			url: "../api/bulkDeviceLoad.php",
			data: {
				action: "get_temporary_attributes", 
				id: $(this).attr("data-id"),
                organization:organization,
				contextbroker: $(this).attr("data-contextBroker")
			},
			type: "POST",
			async: true,
			dataType: 'json',
			success: function (mydata){
				console.log("contenent logg "+JSON.stringify(mydata['content']));

				var row = null;
				$("#editUserPoolsTable tbody").empty();
				myattributes=mydata['content'];            
				content="";
				k=0;
				while (k < myattributes.length)
				{
				console.log("contenent logg "+mydata['content']);
				console.log(k); 
				content += drawAttributeMenu(myattributes[k].value_name, 
				myattributes[k].data_type, myattributes[k].value_type, myattributes[k].editable, myattributes[k].value_unit, myattributes[k].healthiness_criteria, 
				myattributes[k].healthiness_value,myattributes[k].old_value_name, 'editlistAttributes');
				k++;
				}
				$('#editlistAttributes').html(content);
			},
			error: function (data)
			{
				console.log("Get values pool KO");
				console.log(JSON.stringify(data));
				alert("Error in reading data from the database<br/> Please get in touch with the Snap4city Administrator");
				
				$('#inputNameDeviceM').val("");
				$('#selectContextBrokerM').val("");
				$('#inputTypeDeviceM').val("");
				$('#selectKindDeviceM').val("");
				$('#inputUriDeviceM').val("");
				$('#selectProtocolDeviceM').val("");
				$('#selectFormatDeviceM').val("");
				$('#createdDateDeviceM').val("");
				$('#inputMacDeviceM').val("");
				$('#selectModelDeviceM').val("");
				$('#inputProducerDeviceM').val("");
				$('#inputLatitudeDeviceM').val("");															  
				$('#inputLongitudeDeviceM').val("");	
				$('#inputFrequencyDeviceM').val("");
				$('#selectVisibilityDeviceM').val("");
				$('#editlistAttributes').html("");	
				$('#KeyOneDeviceUserM').val("");
				$('#KeyTwoDeviceUserM').val("");
											
						   
				// $("#editDeviceModal").modal('hide');
				  
			}
		});

		});	 
        $('#editDeviceConfirmBtn').off("click");
        $("#editDeviceConfirmBtn").click(function(){
           // $("#editDeviceModalBody").hide();
           // $("#editDeviceModalFooter").hide();
           // $("#editDeviceModalUpdating").show();
            console.log("button confimr clicked");
			
			mynewAttributes = [];
			num1 = document.getElementById('addlistAttributesM').childElementCount;

			//console.log(num1);
            for (var m=0; m< num1; m++)
			{
			  //var selOpt= document.getElementById('addlistAttributesM').childNodes[m].childNodes[2].childNodes[0].childNodes[0].options;
  			  //var selIndex= document.getElementById('addlistAttributesM').childNodes[m].childNodes[2].childNodes[0].childNodes[0].selectedIndex;
			var newatt= {value_name: document.getElementById('addlistAttributesM').childNodes[m].childNodes[0].childNodes[0].childNodes[0].value.trim(), 
			            data_type:document.getElementById('addlistAttributesM').childNodes[m].childNodes[1].childNodes[0].childNodes[0].value.trim(),
						value_type:document.getElementById('addlistAttributesM').childNodes[m].childNodes[2].childNodes[0].childNodes[0].value.trim(),
						editable:document.getElementById('addlistAttributesM').childNodes[m].childNodes[3].childNodes[0].childNodes[0].value.trim(),
						value_unit:document.getElementById('addlistAttributesM').childNodes[m].childNodes[4].childNodes[0].childNodes[0].value.trim(),
						healthiness_criteria: document.getElementById('addlistAttributesM').childNodes[m].childNodes[5].childNodes[0].childNodes[0].value.trim(),
						healthiness_value: document.getElementById('addlistAttributesM').childNodes[m].childNodes[6].childNodes[0].childNodes[0].value.trim()}
                        mynewAttributes.push(newatt);			 
			}
			
			
            myAttributes= [];
			num= document.getElementById('editlistAttributes').childElementCount;
            for (var j=0; j< num; j++)
			{
			  var selectOpt_value_type= document.getElementById('editlistAttributes').childNodes[j].childNodes[2].childNodes[0].childNodes[0].options;
  			  var selectIndex_value_type= document.getElementById('editlistAttributes').childNodes[j].childNodes[2].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_data_type= document.getElementById('editlistAttributes').childNodes[j].childNodes[1].childNodes[0].childNodes[0].options;
  			  var selectIndex_data_type= document.getElementById('editlistAttributes').childNodes[j].childNodes[1].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_value_unit= document.getElementById('editlistAttributes').childNodes[j].childNodes[4].childNodes[0].childNodes[0].options;
  			  var selectIndex_value_unit= document.getElementById('editlistAttributes').childNodes[j].childNodes[4].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_hc= document.getElementById('editlistAttributes').childNodes[j].childNodes[5].childNodes[0].childNodes[0].options;
  			  var selectIndex_hc= document.getElementById('editlistAttributes').childNodes[j].childNodes[5].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_edit= document.getElementById('editlistAttributes').childNodes[j].childNodes[3].childNodes[0].childNodes[0].options;
  			  var selectIndex_edit= document.getElementById('editlistAttributes').childNodes[j].childNodes[3].childNodes[0].childNodes[0].selectedIndex;

			  
			  try{var dt= selectOpt_data_type[selectIndex_data_type].value}catch(err){var dt=""};
			  try{var vt= selectOpt_value_type[selectIndex_value_type].value}catch(err){var vt=""};
			  try{var vu= selectOpt_value_unit[selectIndex_value_unit].value}catch(err){var vu=""};


              var att= {value_name: document.getElementById('editlistAttributes').childNodes[j].childNodes[0].childNodes[0].childNodes[0].value.trim(), 
			       data_type:dt,
				   value_type:vt,
				   editable:selectOpt_edit[selectIndex_edit].value,
				   value_unit:vu,
				   healthiness_criteria: selectOpt_hc[selectIndex_hc].value,
				   healthiness_value: document.getElementById('editlistAttributes').childNodes[j].childNodes[6].childNodes[0].childNodes[0].value.trim(),
				   //sara start				   
				   old_value_name:document.getElementById('editlistAttributes').childNodes[j].childNodes[7].childNodes[0].childNodes[0].value
				   };
				   //sara end
				   myAttributes.push(att);
			  
			}
			 
            mydeletedAttributes= [];
			numDel= document.getElementById('deletedAttributes').childElementCount;
            for (var j=0; j< numDel; j++)
			{
			  var selectOpt_value_type= document.getElementById('deletedAttributes').childNodes[j].childNodes[2].childNodes[0].childNodes[0].options;
  			  var selectIndex_value_type= document.getElementById('deletedAttributes').childNodes[j].childNodes[2].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_data_type= document.getElementById('deletedAttributes').childNodes[j].childNodes[1].childNodes[0].childNodes[0].options;
  			  var selectIndex_data_type= document.getElementById('deletedAttributes').childNodes[j].childNodes[1].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_value_unit= document.getElementById('deletedAttributes').childNodes[j].childNodes[4].childNodes[0].childNodes[0].options;
  			  var selectIndex_value_unit= document.getElementById('deletedAttributes').childNodes[j].childNodes[4].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_hc= document.getElementById('deletedAttributes').childNodes[j].childNodes[5].childNodes[0].childNodes[0].options;
  			  var selectIndex_hc= document.getElementById('deletedAttributes').childNodes[j].childNodes[5].childNodes[0].childNodes[0].selectedIndex;
			  
			  var selectOpt_edit= document.getElementById('deletedAttributes').childNodes[j].childNodes[3].childNodes[0].childNodes[0].options;
  			  var selectIndex_edit= document.getElementById('deletedAttributes').childNodes[j].childNodes[3].childNodes[0].childNodes[0].selectedIndex;
			  
			  var att= {value_name: document.getElementById('deletedAttributes').childNodes[j].childNodes[0].childNodes[0].childNodes[0].value.trim(), 
			       data_type:selectOpt_data_type[selectIndex_data_type].value,
				   value_type:selectOpt_value_type[selectIndex_value_type].value,
				   editable:selectOpt_edit[selectIndex_edit].value,
				   value_unit:selectOpt_value_unit[selectIndex_value_unit].value,
				   healthiness_criteria: selectOpt_hc[selectIndex_hc].value,
				   healthiness_value: document.getElementById('deletedAttributes').childNodes[j].childNodes[6].childNodes[0].childNodes[0].value.trim(),
				   //sara start				   
				   old_value_name: document.getElementById('deletedAttributes').childNodes[j].childNodes[7].childNodes[0].childNodes[0].value
				   };
				   //sara end
				   mydeletedAttributes.push(att);
			}


			
   			   document.getElementById('editlistAttributes').innerHTML = ""; 
		       document.getElementById('addlistAttributesM').innerHTML = ""; 
               document.getElementById('deletedAttributes').innerHTML = "";  

			
			$("#editDeviceModalTabs").hide();
			$('#editDeviceModal div.modalCell').hide();
            $("#editDeviceModalFooter").hide();
			$("#addAttrMBtn").hide();
			
			
            $('#editDeviceLoadingMsg').show();
            $('#editDeviceLoadingIcon').show();
            // console.log(JSON.stringify(deviceJson));
            
           /*************Sara start*
I collapsed the two update functions into a unique one.
I create a JSON object to use the verifyDevice and to get the correct status and validity_msg properly.
Note: the field "validity_msg" has to be modified in the db since now it's 50 character long but the 
error messages returned by verifyDevice are longer.
***********/
			var arrayAttributes=[];
			for(var i = 0; i < myAttributes.length; i++){
				arrayAttributes.push(myAttributes[i]);
			}
			for(var i = 0; i < mynewAttributes.length; i++){
				arrayAttributes.push(mynewAttributes[i]);
			}
			
			console.log("arrayAttributes "+JSON.stringify(arrayAttributes));
            
            //UPDATE FUNCTION
			 var updatedDevice={"contextbroker":$('#selectContextBrokerM').val(),"name":$('#inputNameDeviceM').val(),"devicetype":$('#inputTypeDeviceM').val(),"model":$('#selectModelDeviceM').val(),"macaddress":$('#inputMacDeviceM').val(),"frequency":$('#inputFrequencyDeviceM').val(),"kind":$('#selectKindDeviceM').val(),"protocol":$('#selectProtocolDeviceM').val(),"format":$('#selectFormatDeviceM').val(),"latitude":$('#inputLatitudeDeviceM').val(),"longitude":$('#inputLongitudeDeviceM').val(),"visibility":$('#selectVisibilityDeviceM').val(),"k1":$('#KeyOneDeviceUserM').val(), "k2":$('#KeyTwoDeviceUserM').val(),"producer":$('#inputProducerDeviceM').val(),"edge_gateway_type":$('#selectEdgeGatewayTypeM').val(),"edge_gateway_uri": $('#inputEdgeGatewayUriM').val(), "deviceValues":arrayAttributes};
			 
			 var device_status = 'invalid';
			 var verify = verifyDevice(updatedDevice);
			 console.log("verify "+JSON.stringify(verify));
			 if(verify.isvalid){
				 device_status='valid';
			 }
			 console.log(device_status);
			 console.log(verify.message);
			console.log("attributes "+JSON.stringify(myAttributes));
         
		$.ajax({
            url: "../api/bulkDeviceLoad.php",
            data:{
		    action: "update", 
			username: loggedUser,
            organization:organization,
		    newattributes: JSON.stringify(mynewAttributes),
		    attributes: JSON.stringify(myAttributes),
		    deleteattributes: JSON.stringify(mydeletedAttributes), 
			old_id: gb_old_id,
		    old_cb: gb_old_cb,
			status : device_status,
			validity_msg: verify.message,
			edge_gateway_type: updatedDevice.edge_gateway_type ,
			edge_gateway_uri : updatedDevice.edge_gateway_uri,
			id: updatedDevice.name,
		    type: updatedDevice.devicetype,
		    kind: updatedDevice.kind,
		    contextbroker: $('#selectContextBrokerM').val(),
		    uri: $('#inputUriDeviceM').val(),
		    protocol:updatedDevice.protocol ,
		    format: updatedDevice.format,
		    mac: updatedDevice.macaddress,
		    model: updatedDevice.model,
		    producer: updatedDevice.producer,
		    latitude: updatedDevice.latitude,
		    longitude: updatedDevice.longitude,
		    visibility:updatedDevice.visibility,
		    frequency:updatedDevice.frequency,
		    k1: updatedDevice.k1, //MM2909 this value need to be acquired from the 
		    k2: updatedDevice.k2 //MM2909
/***********************Sara end*************/
		    },
            type: "POST",
            async: true,
            success: function (data) 
            {
				console.log("Marco edit Data " + JSON.stringify(data));

				if(data["status"] === 'ko')
                {
					console.log("Error editing Device type");
					console.log(data);
					$('#editDeviceLoadingMsg').hide();
					$('#editDeviceLoadingIcon').hide();
					$('#editDeviceLoadingIcon').hide();
					$('#editDeviceKoMsg').show();
					$('#editDeviceKoIcon').show();
                     
					setTimeout(function(){
						$('#editDeviceModal').modal('hide');
						fetch_data(true);
						setTimeout(function(){
							   $('#editDeviceModal').hide();
							   setTimeout(updateDeviceTimeout, 100);	  
							  
						}, 100); 
					}, 100);
				} 
				else if (data["status"] === 'ok')
				{
						
					$('#editDeviceLoadingMsg').hide();
					$('#editDeviceLoadingIcon').hide();
					$('#editDeviceOkMsg').show();
					$('#editDeviceOkIcon').show();
								
					$("#editDeviceModalInnerDiv1").html('Device &nbsp; successfully Updated');
					$("#editDeviceModalInnerDiv2").html('<i class="fa fa-check" style="font-size:42px"></i>');
				 
					setTimeout(function(){
						$('#editDeviceModal').modal('hide');
						fetch_data(true);

						setTimeout(function(){
						   // $('#addDeviceOkMsg').hide();
						   // $('#addDeviceOkIcon').hide();
							  $('#editDeviceOkMsg').hide();
							  $('#editDeviceOkIcon').hide();
							  
							  $('#inputNameDevice').val("");
							  $('#inputTypeDevice').val("");
							  $('#selectKindDevice').val("");
							  $('#selectContextBroker').val("");
							  $('#inputUriDevice').val("");
							  $('#selectProtocolDevice').val("");
							  $('#selectFormatDevice').val("");
							  $('#createdDateDevice').val("");
							  $('#inputMacDevice').val("");
							  $('#selectModelDevice').val("");
							  $('#inputProducerDevice').val("");
							  $('#inputLatitudeDevice').val("");
							  $('#inputLongitudeDevice').val("");
							  $('#selectVisibilityDevice').val();
							  $('#inputFrequencyDevice').val();
								
							   $('#editDeviceModal').hide();
							   setTimeout(updateDeviceTimeout, 100);	  
							  
						}, 100);
					}, 100);
					
				   //------------to verify----------//
					var attributesToverify=myAttributes;
					for (var i=0; i<mynewAttributes.length; i++){
						attributesToverify.push(mynewAttributes[i]);
					}
					for (var i=0; i<mydeletedAttributes.length; i++){
						for(var j=0; j<attributesToverify.length; j++){
							if(mydeletedAttributes[i]==attributesToverify[j]){
								attributesToverify.splice(j,1);
								break;
							}
						}
					}
				} else {console.log(data);}
	 
			 },
			 error: function (data) 
			 {
				 console.log("Ko result: " + JSON.stringify(data));
				 $("#editDeviceKoModalInnerDiv1").html(data["msg"]);
				 $("#editDeviceKoModal").modal('show');
				 // $("#editDeviceModalUpdating").hide();
				 $("#editDeviceModalBody").show();
				 $("#editDeviceModalFooter").show();
				 				  
				  $('#inputNameDevice').val("");
				  $('#inputTypeDevice').val("");
				  $('#selectKindDevice').val("");
				  $('#selectContextBroker').val("");
				  $('#inputUriDevice').val("");
				  $('#selectProtocolDevice').val("");
				  $('#selectFormatDevice').val("");
				  $('#createdDateDevice').val("");
				  $('#inputMacDevice').val("");
				  $('#selectModelDevice').val("");
				  $('#inputProducerDevice').val("");
				  $('#inputLatitudeDevice').val("");
				  $('#inputLongitudeDevice').val("");
				  $('#selectVisibilityDevice').val();
				  $('#inputFrequencyDevice').val();
									
				   $('#editDeviceModal').hide();
				   setTimeout(updateDeviceTimeout, 3000);
				  
				}
			}); 
		});
        

		
		$("#editDeviceCancelBtn").off("click");
        $("#editDeviceCancelBtn").on('click', function(){
		
		   	   document.getElementById('editlistAttributes').innerHTML = ""; 
		       document.getElementById('addlistAttributesM').innerHTML = ""; 
               document.getElementById('deletedAttributes').innerHTML = "";  

		
		});	
			
        $("#addNewDeviceCancelBtn").off("click");
        $("#addNewDeviceCancelBtn").on('click', function(){
            
			  $('#inputNameDevice').val("");
			  $('#inputTypeDevice').val("");
			  $('#selectContextBroker').val("");
			  $('#inputUriDevice').val("");
			  $('#selectProtocolDevice').val("");
			  $('#selectFormatDevice').val("");
			  $('#createdDateDevice').val("");
			  $('#inputMacDevice').val("");
			  $('#selectModelDevice').val("");
			  $('#inputProducerDevice').val("");
			  $('#inputLatitudeDevice').val("");
			  $('#inputLongitudeDevice').val("");
			  $("#KeyOneDeviceUser").val("");
		      $("#KeyTwoDeviceUser").val("");
			  $("#KeyOneDeviceUserMsg").html("");
			  $("#KeyTwoDeviceUserMsg").html("");
			  $('#addDeviceModal').modal('hide'); 
			  
			  //.hide();
			  location.reload();    								  
			//  $('#addDeviceModalTabs').show();
			//  $('#addDeviceModal div.modalCell').show();
			//  $('#addDeviceModalFooter').show(); 
        });
        
        $("#addDeviceKoBackBtn").off("click");
        $("#addDeviceKoBackBtn").on('click', function(){
            $("#addDeviceKoModal").modal('hide');
            $("#addDeviceModal").modal('show');
        });
        
        $("#addDeviceKoConfirmBtn").off("click");
        $("#addDeviceKoConfirmBtn").on('click', function(){
            $("#addDeviceKoModal").modal('hide');
            $("#addDeviceForm").trigger("reset");
        });
        
        $("#editDeviceKoBackBtn").off("click");
        $("#editDeviceKoBackBtn").on('click', function(){
            $("#editDeviceKoModal").modal('hide');
            $("#editDeviceModal").modal('show');
        });
        
        $("#editDeviceKoConfirmBtn").off("click");
        $("#editDeviceKoConfirmBtn").on('click', function(){
            $("#editDeviceKoModal").modal('hide');
            $("#editDeviceForm").trigger("reset");
        });
		
	
	$('#devicesTable thead').css("background", "rgba(0, 162, 211, 1)");
	$('#devicesTable thead').css("color", "white");
	$('#devicesTable thead').css("font-size", "1em"); 
	
	

		
	 
			
//  Testing Purpose End


	
});  // end of ready-state


function drawAttributeMenu
(attrName, data_type, value_type, editable, value_unit, healthiness_criteria, value_refresh_rate,old_value_name, parent)
{
    
    options="";
    if (value_type!="") labelcheck= value_type;
    else { //0910Fatima
        labelcheck="";
        options += "<option value=' ' selected> </option>";
    }
	for (var n=0; n < gb_value_types.length; n++)
	{
	  if (labelcheck == gb_value_types[n]) 
		 options += "<option value=\""+gb_value_types[n]+"\" selected>"+ gb_value_types[n]+ "</option>";
	  else options += "<option value=\""+gb_value_types[n]+"\">"+ gb_value_types[n]+ "</option>";
	}
	
    myunits="";// <option value=\"none\"></option>";
    if (value_unit!="") labelcheck= value_unit;
	else labelcheck="";
    for (var n=0; n < gb_value_units.length; n++)
	{
	  if (labelcheck == gb_value_units[n]) 
		 myunits += "<option value=\""+gb_value_units[n]+"\" selected>"+ gb_value_units[n]+ "</option>";
	  else myunits += "<option value=\""+gb_value_units[n]+"\">"+ gb_value_units[n]+ "</option>";
	}
    
    //---start sara---
	if(value_refresh_rate===undefined){
		value_refresh_rate= "";
	}
    var refresh_rate="", different_values="", within_bounds="", healthiness_empty=""; //0910Fatima
	switch(healthiness_criteria){
		case "refresh_rate": refresh_rate ="selected";
							break;
		case "different_values": 
							different_values="selected";
							break;
		case "within_bounds":
							within_bounds="selected";
							break;
        default: //0910Fatima
            healthiness_empty="selected";
            break;
	}

    //0910Fatima--block modification start	
	var editable_true="",editable_false="", editable_empty=""; 
	if(editable=="1"){
		editable_true="selected";
	}
	else if (editable=="0"){
		editable_false="selected";
	}
	else{
        editable_empty="selected";     
    }    
    //0910Fatima--block modification end

    //---end sara
	
	mydatatypes="";
    if (data_type!="") labelcheck= data_type;
	else { //0910Fatima
        labelcheck="";
        mydatatypes += "<option value=' ' selected> </option>";
    }
    
    for (var n=0; n < gb_datatypes.length; n++)
	{
	  if (labelcheck == gb_datatypes[n]) 
		 mydatatypes += "<option value=\""+gb_datatypes[n]+"\" selected>"+ gb_datatypes[n]+ "</option>";
	  else mydatatypes += "<option value=\""+gb_datatypes[n]+"\">"+ gb_datatypes[n]+ "</option>";
	}
	console.log(data_type +","+ value_type+","+ editable+","+ value_unit+","+ healthiness_criteria+","+ value_refresh_rate+","+ parent);
 return "<div class=\"row\" style=\"border:3px solid blue;\" ><div class=\"col-xs-6 col-md-3 modalCell\">" +
        "<div class=\"modalFieldCnt\" title=\"Insert a name for the sensor/actuator\"><input type=\"text\" class=\"modalInputTxt\""+
		"name=\"" +  attrName +  "\"  value=\"" + attrName + "\" onkeyup=\"checkStrangeCharacters(this)\">" + 
        "</div><div class=\"modalFieldLabelCnt\" >Value Name</div></div>"+
			
		"<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\" title=\"select the type of data generated by the sensor/actuator\">"+
		"<select class=\"modalInputTxt\" name=\""+ attrName+"-type" +
		"\">" + mydatatypes + 
		"</select></div><div class=\"modalFieldLabelCnt\">Data Type</div></div>" + 
	
		"<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\" title=\"select the type of the sensor/actuator\">" +
		"<select class=\"modalInputTxt\" name=\""+ value_type +
		"\">" + 		 options + 
		"</select></div><div class=\"modalFieldLabelCnt\">Value Type</div></div>" +
		
		"<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\" title=\"is the sensor/actuator editable?\">" +
		"<select class=\"modalInputTxt\" name=\""+ editable +
		"\">" + 
		"<option value='0' "+editable_false+">false</option>" +
		"<option value='1' "+editable_true+">true</option> </select>" +
        "<option value='' "+editable_empty+"> </option> </select>" + //0910Fatima
		"</div><div class=\"modalFieldLabelCnt\">Editable</div></div>"+
		
		"<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\" title=\"select the unit of the data generated by the sensor/actuator\">" +
		"<select class=\"modalInputTxt\" name=\""+ value_unit +
		"\">" + 
		 myunits + 
		"</select></div><div class=\"modalFieldLabelCnt\">Value Unit</div></div>"+
   		
		"<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\" title=\"select a criterion as a reference to decide whether the sensor/actuator is working well\">" +
		"<select class=\"modalInputTxt\" name=\"" + healthiness_criteria +
		"\" \>"+ 
			"<option value=\"refresh_rate\" "+refresh_rate+">Refresh rate</option>" +
			"<option value=\"different_values\" "+different_values+">Different Values</option>" +
			"<option value=\"within_bounds\" "+within_bounds+">Within bounds</option>" +
			"<option value= ' '"+healthiness_empty+"> </option>" +

	       "</select></div><div class=\"modalFieldLabelCnt\">healthiness criteria</div></div>"+
		
		"<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\" title=\"Insert the limit value(s) to consider the sensor/actuator as healthy, according to the selected criterion \">" +
		"<input type=\"text\" class=\"modalInputTxt\" name=\""+ value_refresh_rate +
		"\" value=\"" + value_refresh_rate + "\"></div><div class=\"modalFieldLabelCnt\">healthiness value</div></div>"+
		//sara start
        "<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\">" +
        "<input type=\"hidden\"  name=\""+ old_value_name +
        "\" value=\"" + old_value_name + "\"></div></div>"+
		//sara end
		"<div class=\"col-xs-6 col-md-3 modalCell\"><div class=\"modalFieldCnt\">" +
		//"<i class=\"fa fa-minus-square\" onclick=\"removeElementAt('" + parent + "',this); return true;\"  style=\"font-size:36px; color: #ffcc00\"></i></div></div></div>";
	    "<button class=\"btn btn-warning\" onclick=\"removeElementAt('" + parent + "',this); return true;\">Remove Value</button></div></div></div>"	
		;

		
}	

function removeElementAt(parent,child) {
    var list = document.getElementById(parent);
	// var content = child.parentElement.parentElement.parentElement.innerHTML
  // console.log("elemento cancellato " + document.getElementById('deletedAttributes').innerHTML);
	if (parent=="editlistAttributes") 
	{     document.getElementById('deletedAttributes').appendChild(child.parentElement.parentElement.parentElement);}
	else list.removeChild(child.parentElement.parentElement.parentElement);
	checkAtlistOneAttribute();
}
function verifyDevice(deviceToverify){
    console.log("VERIFYING THE DEVICE");
    
	var msg="";
    var regexpMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    var regexName=/[^a-z0-9_-]/gi;
    var answer={"isvalid":true, "message":"Your device is valid"};
   
    
    console.log("First checking its properties validity");
    console.log(regexName.test(deviceToverify.name));
    
    if(deviceToverify.name==undefined || deviceToverify.name.length<5 || regexName.test(deviceToverify.name) ){ msg+= "-name is mandatory, of 5 characters at least, no special character is allowed.";}
    if(deviceToverify.devicetype==undefined || deviceToverify.devicetype=="" || deviceToverify.devicetype.indexOf(' ')>=0){msg+="-devicetype is mandatory.";}
    if(deviceToverify.macaddress!=undefined && !regexpMAC.test(deviceToverify.macaddress)){msg+="-macaddress is mandatory and Mac format should be Letter (A-F) and number (eg. 3D:F2:C9:A6:B3:4F).";}
    if(deviceToverify.frequency==undefined ||deviceToverify.frequency=="" || !isFinite(deviceToverify.frequency)){msg+= "-frequency is mandatory, and should be numeric.";}
    console.log(" frequency to verify "+ deviceToverify);
	if(deviceToverify.kind==undefined || deviceToverify.kind==""){msg+="-kind is mandatory.";}
    if(deviceToverify.protocol==undefined || deviceToverify.protocol==""){msg+="-protocol is mandatory.";}
    if(deviceToverify.format==undefined || deviceToverify.format==""){msg+="-format is mandatory.";}
    if(deviceToverify.latitude==undefined || !isLatitude(deviceToverify.latitude)){msg+="-Latitude is mandatory, with the correct numeric format.";}
    if(deviceToverify.longitude==undefined ||!isLongitude(deviceToverify.longitude)){msg+="-Longitude is mandatory, with the correct numeric format.";}
    if(deviceToverify.k1==undefined || deviceToverify.k1==""){msg+="-k1 is mandatory.";}
    if(deviceToverify.k2==undefined || deviceToverify.k2==""){msg+="-k2 is mandatory.";}
    
    var keysCheking= checkKeys(deviceToverify.k1, deviceToverify.k2);
    console.log("here");
    console.log(keysCheking);
    if (!keysCheking.isvalid){msg+=keysCheking.validity_msg}
      
    if(msg.length>0) answer.isvalid=false;

     
	if(deviceToverify.deviceValues.length<1){
           answer.isvalid=false;
           msg+="-Your device should at least have 1 attributes.";
        }
        
    console.log("Now we check the model conformity");
    
	if(deviceToverify.model!="custom"){
		
		console.log("The model is not custom, it is "+ deviceToverify.model);
        
        for(var i=0; i<modelsdata.length; i++){
                
                
			if(modelsdata[i].name!=deviceToverify.model){
                continue;
				}
            
			var modelAttributes= JSON.parse(modelsdata[i].attributes);
                
            console.log("model attributes " + JSON.stringify(modelAttributes));
            console.log("deviceToVerify attributes " + JSON.stringify(deviceToverify.deviceValues));
            console.log(Object.keys(modelAttributes).length);
            console.log(Object.keys(deviceToverify.deviceValues).length);

            if(Object.keys(modelAttributes).length!=Object.keys(deviceToverify.deviceValues).length){
                   
                answer.isvalid=false;
                msg+="-Your device has different number of attributes than the selected model ";
                   }
                
            else{
                        
                            
                for (var j=0; j<deviceToverify.deviceValues.length; j++){
                                var found=0;
                                for(var l= 0; l<modelAttributes.length; l++){
                                 console.log(" attributes model "+ modelAttributes[l].value_name);   
                                 console.log(" attributes device to verify "+deviceToverify.deviceValues[j].value_name);   
                                    if(modelAttributes[l].value_name==deviceToverify.deviceValues[j].value_name){
                                        found=1;
										console.log(modelAttributes[l].value_type!=deviceToverify.deviceValues[j].value_type );
										console.log(modelAttributes[l].data_type!=deviceToverify.deviceValues[j].data_type );
										console.log(modelAttributes[l].editable!=deviceToverify.deviceValues[j].editable);
										console.log(modelAttributes[l].healthiness_criteria!=deviceToverify.deviceValues[j].healthiness_criteria);
										console.log(modelAttributes[l].healthiness_value!=deviceToverify.deviceValues[j].healthiness_value);
										console.log(modelAttributes[l].value_unit!=deviceToverify.deviceValues[j].value_unit);
                                        
                                        var msg_attr_detail=""
                                        
                                        if(modelAttributes[l].value_type!=deviceToverify.deviceValues[j].value_type)
                                        {msg_attr_detail+=" value type,";}
                                        if(modelAttributes[l].data_type!=deviceToverify.deviceValues[j].data_type)
                                        {msg_attr_detail+=" data type,";}
                                        if(modelAttributes[l].editable!=deviceToverify.deviceValues[j].editable)
                                        {msg_attr_detail+=" editable,";}
                                        if(modelAttributes[l].healthiness_criteria!=deviceToverify.deviceValues[j].healthiness_criteria)
                                        {msg_attr_detail+=" healthiness criteria,";}
                                        if(modelAttributes[l].healthiness_value!=deviceToverify.deviceValues[j].healthiness_value){msg_attr_detail+=" healthiness value,";}
                                        if(modelAttributes[l].value_unit!=deviceToverify.deviceValues[j].value_unit)
                                            {msg_attr_detail+=" value unit,";}
                                        
                                        if(msg_attr_detail.length>0){
                                            answer.isvalid=false;
                                            msg+="The attribute "+deviceToverify.deviceValues[j].value_name+" has the details:"+msg_attr_detail+" not compatible with its model.";
                                        }
                                        else{
                                            modelAttributes.splice(l,1);                                        }
                                    }
                                }
                                if(found==0){
                                    answer.isvalid=false;
                                    msg+="-The device attribute name "+ deviceToverify.deviceValues[j].value_name+ " do not comply with its model."     
                                }

                            }
                        
                
                    
                   
                   }
            
            
            console.log("modelsdata[i].edge_gateway_type");
                console.log(modelsdata[i].edge_gateway_type);
                console.log("deviceToverify.edge_gateway_type");
                console.log(deviceToverify.edge_gateway_type);
                
                var h3= (modelsdata[i].edge_gateway_type==deviceToverify.edge_gateway_type)||
                        (
                            (modelsdata[i].edge_gateway_type==undefined || modelsdata[i].edge_gateway_type=="" || modelsdata[i].edge_gateway_type== null)&&
                            (deviceToverify.edge_gateway_type==undefined || deviceToverify.edge_gateway_type=="" || deviceToverify.edge_gateway_type== null)
                            
                        );
                     
                       
                if(modelsdata[i].contextbroker!=deviceToverify.contextbroker){ answer.isvalid=false; 
                                                                              msg+="-The device property: context broker does not comply with its model." ;} 
                if(modelsdata[i].devicetype!=deviceToverify.devicetype) {
				answer.isvalid=false;
                   msg+="-The device property: type does not comply with its model." ;}
                if(!h3){ answer.isvalid=false; 
                        msg+="-The device property: edge gateway type does not comply with its model." ;}
                if(modelsdata[i].format!=deviceToverify.format){ answer.isvalid=false;
                                                                msg+="-The device property: format does not comply with its model." ;}
                if(modelsdata[i].frequency!=deviceToverify.frequency){ answer.isvalid=false; 
                                                                      msg+="-The device property: frequency does not comply with its model." ;}
                if(modelsdata[i].kind!=deviceToverify.kind){ answer.isvalid=false;
                                                            msg+="-The device property: kind does not comply with its model." ;}
                if(modelsdata[i].producer!=deviceToverify.producer){ answer.isvalid=false;
                                                            msg+="-The device property: producer does not comply with its model." ;}
                if(modelsdata[i].protocol!=deviceToverify.protocol){{ answer.isvalid=false;
                                                            msg+="-The device property: protocol does not comply with its model." ;}}
                              
            }
            
        }
        
        else{
            console.log("model is custom so we check the values details "+deviceToverify.deviceValues.length);
            var regex=/[^a-z0-9_-]/gi;
            var all_attr_msg="";
            var strangecharactermsg="";
            var all_attr_status="true";
            var healthiness_criteria_options=["refresh_rate", "different_values", "within_bounds"];

            for (var i=0; i<deviceToverify.deviceValues.length; i++){
                var v=deviceToverify.deviceValues[i];
                console.log("for");

                if(v==undefined){
					console.log("undefined");
				continue;}
                var attr_status=true;
                var attr_msg="";
                console.log(v);
                console.log(deviceToverify.deviceValues.length);
                console.log(deviceToverify);
								console.log("data type deb " + v.data_type);
				console.log("value_unit  dev"+v.value_unit);
				//Sara3010
				var empty_name = false;

                if(v.value_name==undefined || v.value_name==""){
                   attr_status=false;
				   empty_name = true;
               }
                if(regex.test(v.value_name)){
                    attr_status=false;
                        strangecharactermsg= ", no special characters are allowed in value name ";
                }
                //set default values
                if(v.data_type==undefined || v.data_type==""|| gb_datatypes.indexOf(v.data_type)<0){
						console.log("data type "+v.data_type + " gb "+ gb_datatypes.indexOf(v.data_type));
                       
					   attr_status=false;
                        attr_msg = attr_msg+ " data_type";
                }
				//Sara3010 - Start
                if(v.value_unit==undefined || v.value_unit==""){
                        attr_status=false;
                        attr_msg = attr_msg+ " value_unit";
                }				
				//Sara3010 - End
				console.log("gb " + gb_value_types.indexOf(v.value_type));

                if(v.value_type==undefined || v.value_type==""|| gb_value_types.indexOf(v.value_type)<0){
						console.log("valie")
						attr_status=false;
                        attr_msg =attr_msg+ " value_type";
                }
                if(v.editable!="0" && v.editable!="1"){
                        attr_status=false;
                        attr_msg =attr_msg+ " editable";
                }
                if(v.healthiness_criteria==undefined || v.healthiness_criteria==""||healthiness_criteria_options.indexOf(v.healthiness_criteria)<0){
                        attr_status=false;
                        attr_msg =attr_msg+ " healthiness_criteria";
                }
                if(v.healthiness_value==undefined || v.healthiness_value==""){
                        attr_status=false;
                        attr_msg =attr_msg+ " healthiness_value";
                }

                if (attr_status==false){
                    
					all_attr_status=false;
					//Sara3010
					if(empty_name){
						all_attr_msg= "The attribute name cannot be empty"+strangecharactermsg;
						if(attr_msg != ""){
							all_attr_msg= all_attr_msg+", other errors in: "+attr_msg;
						}
					}
					else{
						all_attr_msg= "For the attribute: "+ v.value_name+ strangecharactermsg+", error in: "+attr_msg;
					}
					
					
					
					
                }

            }

            if(!all_attr_status){
                answer.isvalid=false;
                msg= msg+ " -"+all_attr_msg;
        }
        }
    //}
    
    //answer.isvalid=true;
    if(answer.isvalid){
        return answer;
    }
    else{
        answer.message=msg;
        return answer;
    }
    
}

function checkKeys(k1,k2)
	{
			var message = null;
			var pattern = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
			
			var value1 = k1;
			var value2 = k2;
            var valid= true;
			
        
			if((value1 === '') &&  (value2 === ''))
			{
				valid=false;
                message = 'Specify Key for the selected option';
								
			}
			else if(!pattern.test(value1) || !pattern.test(value2))
			{
				message = 'The Key should contain at least one special character and a number';
                valid=false;
            }
	   
        return {isvalid: valid, validity_msg: message}; 		
    
    }


function drawMap(latitude,longitude, id, devicetype, kind, divName){ 
     
     if (typeof map === 'undefined' || !map) { 
             map = L.map(divName).setView([latitude,longitude], zoomLevel);
             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                 attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
             }).addTo(map);

             window.node_input_map = map;   
         }
         
         map.setView([latitude,longitude], 10);

     if (typeof theMarker != 'undefined') {
             map.removeLayer(theMarker); 
            }
         theMarker= L.marker([latitude,longitude]).addTo(map).bindPopup(id + ', ' + devicetype + ', ' + kind);
         setTimeout(function(){ map.invalidateSize()}, 400);
  } 

function isLatitude(lat) {
  return isFinite(lat) && Math.abs(lat) <= 90;
}

function isLongitude(lng) {
  return isFinite(lng) && Math.abs(lng) <= 180;
}

 function drawMap1(latitude,longitude,flag){	
	var marker;
	if(typeof map1==='undefined' || !map1){
	if (flag ==0){
		
        map1 = L.map('addLatLong').setView([latitude,longitude], zoomLevel);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map1);
		window.node_input_map = map1;
		
		
		setTimeout(function(){ map1.invalidateSize()}, 400);
		
		//L.marker([latitude,longitude]).addTo(map).bindPopup(latitude + ',' + longitude);
		
			map1.on("click", function (e) {
			
			var lat = e.latlng.lat;
			var lng = e.latlng.lng;
				lat = lat.toFixed(4);
				lng = lng.toFixed(4);
				console.log("Check the format:" + lat + " " + lng);
				
				 document.getElementById('inputLatitudeDevice').value = lat;
				 document.getElementById('inputLongitudeDevice').value = lng;
				 addDeviceConditionsArray['inputLatitudeDevice'] = true;
				 checkDeviceLatitude(); checkAddDeviceConditions(); 
                 addDeviceConditionsArray['inputLongitudeDevice'] = true;
				 checkDeviceLongitude(); checkAddDeviceConditions(); 
				 if (marker){
					 map1.removeLayer(marker);
				 }
				 marker = new L.marker([lat,lng]).addTo(map1).bindPopup(lat + ',' + lng);
			
			});
        
		

	} else if (flag==1){
		
		map1 = L.map('editLatLong').setView([latitude,longitude], 10);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map1);
		window.node_input_map = map1;
		//L.marker([latitude,longitude]).addTo(map).bindPopup("Hi DEVICE");
		
		setTimeout(function(){ map1.invalidateSize()}, 400);
		
		marker = new L.marker([latitude,longitude]).addTo(map1).bindPopup(longitude + ',' + longitude);
	
			map1.on("click", function (e) {
				
				var lat = e.latlng.lat;
				var lng = e.latlng.lng;
				lat = lat.toFixed(4);
				lng = lng.toFixed(4);
				console.log("Check the format:" + lat + " " + lng);
				
				document.getElementById('inputLatitudeDeviceM').value = lat;
				document.getElementById('inputLongitudeDeviceM').value = lng;
				 editDeviceConditionsArray['inputLatitudeDeviceM'] = true;
                 editDeviceConditionsArray['inputLongitudeDeviceM'] = true;
				 if (marker){
					 map1.removeLayer(marker);
				 }
				 marker = new L.marker([lat,lng]).addTo(map1).bindPopup(lat+ ',' + lng);
			
			});
		
	}
    }
}

function nodeJsTest(){
	var progress_modal = document.getElementById('myModal');
    var span = document.getElementsByClassName("close")[0];
    var spin = document.getElementById("loader_spin");
    var progress_ok=document.getElementById('progress_ok');
    document.getElementById('myModalBody').innerHTML= "Inserting the valid devices...";
    progress_modal.style.display = "block";
    spin.style.display="block";
    progress_ok.style.display="none";
    
		  
		 $.ajax({
			 url: "../api/bulkDeviceLoad.php",
			 data:{
				  action: "get_count_temporary_devices", 
				  username: loggedUser,
				   token : sessionToken,
                 organization:organization
				 },
			 type: "POST",
			 async: true,
			 dataType: "JSON",
			 timeout: 0,
			 success: function (mydata) 
			 {
				if (mydata['content'] != undefined){
				 	var content = mydata['content'];
					
					
				    console.log("Success "+ JSON.stringify(content));
				    console.log(typeof(parseInt(content)));
					if(typeof(parseInt(content))=="number"){
                            insertValidDevices(parseInt(content));
                        }
                    else{
                           document.getElementById('myModalBody').innerHTML= "couldn't find any device to insert";
						   progress_ok.style.display="block";
						   spin.style.display="none"; 
                        }
					
				}
				else{
					document.getElementById('myModalBody').innerHTML= "couldn't find any device to insert";
				    progress_ok.style.display="block";
					spin.style.display="none";				
				}
			 },
			 error: function (mydata)
			{
				console.log("Error "+ JSON.stringify(mydata));
				document.getElementById('myModalBody').innerHTML= "couldn't find any device to insert";
                progress_ok.style.display="block";
                spin.style.display="none";
				
			 }
		
		});
	
	
	var test_data={
				  action: "bulkload", 
				  username: loggedUser,
                  organization:organization,
                  kbUrl:kbUrl,
                  start:1,
                  end:6,
				  token : sessionToken
				  
				 };
	alert("Request sent");	
	$.post('../api/bulkDeviceLoad.php', {'data' : test_data, 'data_from_nodeJs':1}, function(data) {
			console.log("done");
			console.log(data);
		});
   /*$.ajax({
			 url: "https://www.snap4city.org/iotdirectorytest/stubs/bulkload",
			 data:{
				  action: "bulkload", 
				  username: loggedUser,
				  token : sessionToken
				 },
			 type: "POST",
			 async: true,
			 dataType: "json",
			 timeout: 0,
			 success: function (mydata) 
			 {
					console.log("mydata "+JSON.stringify(mydata));
				}
				
             ,
			 error: function (mydata)
			{
				console.log("Error "+ JSON.stringify(mydata));
				
			 }
		
		}); */
    
}

function insertValidDevices(){
    
	
	
    
    var data={
				  action: "bulkload", 
				  username: loggedUser,
				  token : sessionToken,
				  data_parallel: 1,
                  organization:organization,
                  kbUrl:kbUrl
				 };
		
	//../api/bulkDeviceLoad.php
	$.post('../api/async_request.php', {'data' : data}, function(response_data) {
		
            var progress_modal = document.getElementById('myModal');
            var span = document.getElementsByClassName("close")[0];
            var spin = document.getElementById("loader_spin");
            var progress_ok=document.getElementById('progress_ok');
            
        
        
            console.log("done");
			/*console.log(response_data);
			response_data= JSON.parse(response_data);
			console.log(response_data);
			console.log(response_data['status']);
			if(response_data['status']=="ok"){
				
                document.getElementById('myModalBody').innerHTML= "<p>Your valid devices have been uploaded.</p> ";
                progress_modal.style.display = "block";
                spin.style.display="none";
                progress_ok.style.display="block";
			}
			else{
				
                document.getElementById('myModalBody').innerHTML= "<p>some problems occurred while uploading your valid devices.</p> ";
                progress_modal.style.display = "block";
                spin.style.display="none";
                progress_ok.style.display="block";
			}*/
			
		});
    //alert("Request sent, processing ...");
    
    var progress_modal_b = document.getElementById('myModal_forbulkstatus');
    var span_b = document.getElementsByClassName("close")[0];
    var spin_b = document.getElementById("loader_spin_forbulkstatus");
    var progress_ok_b=document.getElementById('progress_ok_forbulkstatus');
	var progress_stop_b=document.getElementById('progress_stop_forbulkstatus');
    document.getElementById('myModalBody_forbulkstatus').innerHTML= "<p>Inserting the valid devices is being processed...</p> By clicking 'Ok' you will be redirected to the main page, but the process will be running anyway.";
    progress_modal_b.style.display = "block";
    spin_b.style.display="none";
    progress_ok_b.style.display="block";
    progress_stop_b.style.display="block";
    
    checkBulkStatus(1);
    
    
}

function stop_progress(){
    var progress_modal = document.getElementById('myModal_forbulkstatus');
    progress_modal.style.display = "none";
    
    if(timerID!=undefined){
        clearInterval(timerID); // The setInterval it cleared and doesn't run anymore.
    }
    
     $.ajax({
			 url: "../api/bulkDeviceLoad.php",
			 data:{
				  action: "stop_bulk", 
				  username: loggedUser,
				  token : sessionToken,
                 organization:organization
				 },
			 type: "POST",
			 async: true,
			 dataType: "JSON",
			 timeout: 0,
			 success: function (mydata) 
			 {
                 console.log("bulk stop "+JSON.stringify(mydata));
                 if(mydata["status"]=='ok'){
                     is_processing=0;
                     refresh();
                 }
                 else{
                    console.log("Error stoping the bulkload "+ mydata); 
                 }
             },
             error: function(mydata){
                 console.log("Failure in stoping bulkload "+ JSON.stringify(mydata));
             }
    });

}

function dismiss_dialog(){
    var progress_modal = document.getElementById('myModal_forbulkstatus');
    progress_modal.style.display = "none";
    
    if(timerID!=undefined){
        clearInterval(timerID); // The setInterval it cleared and doesn't run anymore.
    }
    
    //window.location = 'https://www.snap4city.org/iotdirectorytest/management/contextbroker.php';
    window.location.replace('../management/devices.php');

}

function checkBulkStatus(was_processing=0){
    
    is_processing=1;
    
    is_finished=0;
    var progress_modal = document.getElementById('myModal_forbulkstatus');
    var span = document.getElementsByClassName("close")[0];
    var spin = document.getElementById("loader_spin_forbulkstatus");
    var progress_ok=document.getElementById('progress_ok_forbulkstatus');
    var progress_stop=document.getElementById('progress_stop_forbulkstatus');
    
    if (timerID!= undefined){
        clearInterval(timerID);
    }
    
    timerID = setInterval(function() {
    
        console.log("is finished "+ is_finished);
        console.log("is processing "+ is_processing);
        console.log("was processing "+ was_processing);
        
        if(is_processing==0){
            clearInterval(timerID);
            progress_modal.style.display = "none";
            
            if(was_processing==1 && is_finished==1){
                var progress_modal_ = document.getElementById('myModal');
                var spin_ = document.getElementById("loader_spin");
                var progress_ok_=document.getElementById('progress_ok');
                document.getElementById('myModalBody').innerHTML= "<p>Your valid devices have been uploaded.</p> ";
                progress_modal_.style.display = "block";
                spin_.style.display="none";
                progress_ok_.style.display="block";
                was_processing=0;
                
            }
        }
        else{
        
        $.ajax({
			 url: "../api/bulkDeviceLoad.php",
			 data:{
				  action: "get_bulk_status", 
				  username: loggedUser,
                  organization: organization,
				  token : sessionToken
				 },
			 type: "POST",
			 async: true,
			 dataType: "JSON",
			 timeout: 0,
			 success: function (mydata) 
			 {
                 console.log("bulkstatus checked "+JSON.stringify(mydata));
                 if(mydata["status"]=='ok'){
                     if(mydata['is_bulk_processing']==1|| mydata['is_bulk_processing']=='1'){
                            
                            is_processing=1;
                            was_processing=1;
                         
                         var nb_processed= parseInt(mydata['number_processed']);
                         var totale_processed=parseInt(mydata['totale']);
                         var percentage_processed=0;
                         
                         if(nb_processed!=undefined && nb_processed!=0 && !isNaN(nb_processed) && totale_processed!=undefined && totale_processed!=0 && !isNaN(totale_processed)){
                             percentage_processed=Math.min(100,Math.ceil(nb_processed*100/totale_processed));
                             
                              document.getElementById('myModalBody_forbulkstatus').innerHTML= "<p>Inserting the valid devices is being processed...</p> By clicking 'Ok' you will be redirected to the main page, but the process will be running anyway.<p> "+percentage_processed+" % of your valid devices have been processed";
                         }else{
                             document.getElementById('myModalBody_forbulkstatus').innerHTML= "<p>Inserting the valid devices is being processed...</p> By clicking 'Ok' you will be redirected to the main page, but the process will be running anyway.<p> ";
                         }
                            progress_modal.style.display = "block";
                            spin.style.display="none";
                            progress_ok.style.display="block";
                            progress_stop.style.display="block";
                     }
                     else{
                         is_processing=0;
                         is_finished=mydata["is_finished"];
                     }
                 }
                 else{
                    console.log("Error retrieving the bulkstatus "+ mydata); 
                 }
             },
             error: function(mydata){
                 console.log("Failure in retrieving the bulkstatus "+ JSON.stringify(mydata));
             }
    });
        }
        
         }, 3 * 1000);//each 3 seconds 
}

function insertValidDevices_old(totalDevices){
	
    /*console.log("called");
    var progress_modal = document.getElementById('myModal');
    var span = document.getElementsByClassName("close")[0];
    var spin = document.getElementById("loader_spin");
    var progress_ok=document.getElementById('progress_ok');
    progress_modal.style.display = "block";
    spin.style.display="block";
    progress_ok.style.display="none";*/
    var bulk_offset=10;
    var start_index=1;
    var end_index=bulk_offset;
    if(totalDevices<bulk_offset){
        end_index=totalDevices;
    }
    
    if(end_index<=totalDevices){
        
       insertValidDevicesByPieces_parallel(start_index,end_index,totalDevices,bulk_offset);
	
    }
}

function insertValidDevicesByPieces_parallel(start_index,end_index,totalDevices,bulk_offset){
    
	end_index=totalDevices;
	bulk_offset=totalDevices;
	
	var data={
				  action: "bulkload", 
				  username: loggedUser,
                  start:start_index,
                  end:end_index,
				  token : sessionToken,
				  data_parallel: 1,
                  organization:organization
				 };
	alert("Request sent, processing ...");	
	//../api/bulkDeviceLoad.php
	$.post('../api/async_request.php', {'data' : data}, function(response_data) {
			console.log("done");
			response_data= JSON.parse(response_data);
			console.log(response_data);
			console.log(response_data['status']);
			if(response_data['status']=="ok"){
				alert("Your valid devices have been uploaded.");
			}
			else{
				alert("some problems occurred while uploading your valid devices");
			}
			
		});
    
}

function insertValidDevicesByPieces(start_index,end_index,totalDevices,bulk_offset){
    
    $.ajax({
			 url: "../api/bulkDeviceLoad.php",
			 data:{
				  action: "bulkload", 
				  username: loggedUser,
                  start:start_index,
                  end:end_index,
				  token : sessionToken,
                 organization:organization
				 },
			 type: "POST",
			 async: true,
			 dataType: "JSON",
			 timeout: 0,
			 success: function (mydata) 
			 {
					console.log("mydata "+JSON.stringify(mydata));
					console.log("mydata[content] "+JSON.stringify(mydata['content']));
				//Sara3110 - To remove waiting message
				//document.getElementById('myModalBody').innerHTML = "";
				
				if (mydata['content'] != undefined){
				 	var content = mydata['content'];
					content = content[0];
					console.log("Success "+ JSON.stringify(content));
					
					if(content!=undefined){
						var user_message="";
						console.log("msg "+mydata["msg"]);
					    console.log("content "+content);
					
                        for(var i = 0; i < content.length; i++){
						   console.log("for i "+i+" length "+content[i].inserted);
						 /*Sara3110  if(mydata["msg"]=="" ||typeof mydata["msg"] === 'undefined' || mydata["msg"] === null)
						   {*/
								if(content[i].inserted=='ok'){
									user_message="Device: "+content[i].device+" on context broker "+ content[i].cb +" uploaded";
									
									//Sara3110 - Start
									if(content[i].deleted != undefined && content[i].deleted == "ko"){
											user_message = user_message+ " Not removed from the temporary list.";
									}
									else if(content[i].deleted != undefined && content[i].deleted == "ko"){
														user_message = user_message+ " Ok. ";
									}
									//Sara 3110 -end
									//user_message_old= document.getElementById('myModalBody').innerHTML;			
								}
								else if(content[i].inserted=='ko'){
									user_message="Device: "+content[i].device+" on context broker "+ content[i].cb +" is invalid,  not inserted";
									//user_message_old= document.getElementById('myModalBody').innerHTML;			
								}
							/* Sara3110}
							else{
                                //user_message= mydata["msg"];
								user_message="Some devices not inserted";
									
							}*/
							user_message_old= document.getElementById('myModalBody').innerHTML;
                            document.getElementById('myModalBody').innerHTML= user_message_old+"<p>"+user_message+"</p>";
						}

				}
				else{
					user_message= mydata["msg"];
                    user_message_old= document.getElementById('myModalBody').innerHTML;
					document.getElementById('myModalBody').innerHTML= user_message_old+ "<p>Some devices may have encountered a problem while being inserted.</p>";
				
				}
			 }
             },
			 error: function (mydata)
			{
							//Sara3110 - To remove waiting message
				//document.getElementById('myModalBody').innerHTML = "";
				console.log("Error "+ JSON.stringify(mydata));

				//user_message=mydata.msg;
				//user_message_old= document.getElementById('myModalBody').innerHTML;
				
				//document.getElementById('myModalBody').innerHTML= user_message_old+"<p>Some devices may have encountered a problem while being inserted.</p>";
				console.log("Error inserting device " +mydata["msg"]);  
				console.log("Error status -- Ko result: " + JSON.stringify(mydata));
				 
				
				
			 },
             complete: function(){
                 //ATTENTION: THIS TIMEOUT HERE TO GIVE SOME TIME BETWEEN EACH REQUEST
                setTimeout(function(){
				
                    console.log("another call maybe");
                    start_index=end_index+1;
    
                    if(end_index==totalDevices){
                        end_index=totalDevices+1; 
                        
                        $.ajax({
                            url: "../api/bulkDeviceLoad.php",
                            data:{
                                action: "delete_after_insert",
                                username: loggedUser, 
                                token : sessionToken
                                },
                            type: "POST",
                            datatype: "json",
                            async: true,
                            success: function (data) 
                            {
                                console.log(JSON.stringify(data));
                                if(data["status"] === 'ko')
                                {
                                    user_message_old= document.getElementById('myModalBody').innerHTML;
                                    user_message="<p>An error occured while deleting your valid devices</p>";
                                    document.getElementById('myModalBody').innerHTML= user_message_old+user_message;

                                }
                                else if(data["status"] === 'ok')
                                {
                                    //show nothing for he user..

                                }
                            },
                            error: function (data) 
                            {
                                console.log(JSON.stringify(data));
                               
                               
                            }, 
                            complete: function(){
                                
                                
                                user_message_old= document.getElementById('myModalBody').innerHTML;
                                user_message="<p>OK, done</p>";
                                document.getElementById('myModalBody').innerHTML= user_message_old+user_message;
                                
                                var spin = document.getElementById("loader_spin");
                                var progress_ok=document.getElementById('progress_ok');
                                progress_ok.style.display="block";
                                spin.style.display = "none";
                                //location.reload(); //ATTENTION- refresh page after finishing uploading the file

                        }
                    });
                        
                        
                    }
                    else if(end_index+bulk_offset<totalDevices){
                    end_index=end_index+bulk_offset;
                    }                
                    else{
                        end_index=totalDevices;    
                    }
                    
                    if(end_index<=totalDevices){
        
                       insertValidDevicesByPieces(start_index,end_index,totalDevices,bulk_offset);

                    }
                    
				
			},500);
                 
                 
             }
		
		});
}

function checkHeadersIfValid(csvheaders){
  
    var answer= {"isValid":"","msg":"", "headers":[]};
    var a = new Set(requiredHeaders);
    var b = new Set([]); 
    
   /* if(csvheaders.length < requiredHeaders.length){
        answer.isValid=false;
        answer.msg="Your input file is missing "+(requiredHeaders.length-csvheaders.length)+" fields, please add them and retry again."
        return answer;
    }*/
    
    var found=0;

    for (var i=0; i<csvheaders.length; i++){

        var h= csvheaders[i];
        if(h.trim().toLowerCase().indexOf("name")>-1 && h.trim().toLowerCase().indexOf("data")<0 && h.trim().toLowerCase().indexOf("val")<0 ){
            found=found+1;
            csvheaders[i]="name";
            b.add("name");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("dev")>-1 && h.trim().toLowerCase().indexOf("type")> -1){
            found=found+1;
            csvheaders[i]="devicetype";
            b.add("devicetype");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("mac")>-1){
            found=found+1;
            csvheaders[i]="macaddress";
            b.add("macaddress");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("freq")>-1){
            found=found+1;
            csvheaders[i]="frequency";
            b.add("frequency");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("kind")>-1){
            found=found+1;
            csvheaders[i]="kind";
            b.add("kind");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("proto")>-1){
            found=found+1;
            csvheaders[i]="protocol";
            b.add("protocol");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("form")>-1){
            found=found+1;
            csvheaders[i]="format";
            b.add("format");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("prod")>-1){
            found=found+1;
            csvheaders[i]="producer";
            b.add("producer");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("gate")>-1 && h.trim().toLowerCase().indexOf("type")>-1){
            found=found+1;
            csvheaders[i]="edge_gateway_type";
            b.add("edge_gateway_type");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("gate")>-1 && h.trim().toLowerCase().indexOf("uri")>-1){
            found=found+1;
            csvheaders[i]="edge_gateway_uri";
            b.add("edge_gateway_uri");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("lat")>-1){
            found=found+1;
            csvheaders[i]="latitude";
            b.add("latitude");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("long")>-1){
            found=found+1;
            csvheaders[i]="longitude";
            b.add("longitude");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("k1")>-1){
            found=found+1;
            csvheaders[i]="k1";
            b.add("k1");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("k2")>-1){
            found=found+1;
            csvheaders[i]="k2";
            b.add("k2");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("value")>-1 && h.trim().toLowerCase().indexOf("name")>-1){
            found=found+1;
            csvheaders[i]="value_name";
            b.add("value_name");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("data")>-1 && h.trim().toLowerCase().indexOf("type")>-1){
            found=found+1;
            csvheaders[i]="data_type";
            b.add("data_type");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("value")>-1 && h.trim().toLowerCase().indexOf("type")>-1){
            found=found+1;
            csvheaders[i]="value_type";
            b.add("value_type");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("edit")>-1){
            found=found+1;
            csvheaders[i]="editable";
            b.add("editable");
            continue;
        }
        if(h.trim().toLowerCase().indexOf("unit")>-1){
            found=found+1;
            csvheaders[i]="value_unit";
            b.add("value_unit");
            continue;
        }
         if(h.trim().toLowerCase().indexOf("criteria")>-1 && h.trim().toLowerCase().indexOf("health")>-1){
            found=found+1;
            csvheaders[i]="healthiness_criteria";
            b.add("healthiness_criteria");
            continue;
        }
         if(h.trim().toLowerCase().indexOf("health")>-1 && h.trim().toLowerCase().indexOf("value")>-1){
            found=found+1;
            csvheaders[i]="healthiness_value";
            b.add("healthiness_value");
            continue;
        }
        
    }
    
    var difference = new Set([...a].filter(x => !b.has(x)));
    
    console.log("difference is ");
    console.log(difference);
    
    if (difference.size==0){
        answer.isValid= true;
        answer.msg="your file headers are valid";
        answer.headers= csvheaders;
        return answer;
    }
    else if(difference.size==requiredHeaders.length){
        answer.isValid=false;
        answer.msg="your file has none of the required fields.";
        return answer;
    }
    
    else{
        var message="";
        difference.forEach(function(item){
            message+=item+", ";
        });
        answer.isValid=false;
        answer.msg="your file is missing these fields: "+ message+" please add them and try again.";
        return answer;
    }
    
    
}

function showValidityMsg(status, msg){
    
   console.log(msg);
    alert(msg);
    
    
}

/****added by Sara, copied from devices.js at line 3220 *********/
	function generateUUID() { // Public Domain/MIT
		var d = new Date().getTime();
		if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
			d += performance.now(); //use high-precision timer if available
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
	}

    //Fatima4
    function generateKeysCLicked(){
        var k1= generateUUID();
        var k2= generateUUID();
        $("#KeyOneDeviceUser").val(k1);
        $("#KeyTwoDeviceUser").val(k2);
        showAddDeviceModal();
    }
    
    //Fatima4
    function editGenerateKeysCLicked(){
        var k1= generateUUID();
        var k2= generateUUID();
        $("#KeyOneDeviceUserM").val(k1);
        $("#KeyTwoDeviceUserM").val(k2);
        showEditDeviceModal();
    }
/*****Sara end**/

function refresh(){
    location.reload();
}
