const express = require('express');
const app = express();
const fs = require("fs");
const { parse } = require("csv-parse");

const QRCode = require('qrcode');
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res)  {
    res.sendFile(__dirname + "/public/index.html");
});
var result = [];



app.post("/run", async (req, res) => {
  result = []; 

  try {

    fs.createReadStream("./emails.csv")
    .pipe(parse(
        {
            delimiter: ",",
            relax_quotes: true,
        }
    ))
    .on("data", (data) => {
        if (data[0].length > 5) {
           // console.log("data: ", data);
            if (data[0].includes(",") && data[0].split(",")[1].length > 0) {
                result.push([data[0], data[0].split(",")[1]]);
            }
            else {
                QRCode.toString(data[0], {
                    errorCorrectionLevel: 'H',
                    type: 'svg',
                    }, function(err, qr) {
                    if (err) throw err;
                    console.log('QR code saved!');
                    //console.log(qr);
                    result.push([data[0], qr]);
                    });
            }
        }
        else {
            console.log("empty!")
        }
    })
    .on("end", () => {
                console.log(result);

                // Overwrite the CSV file
                const csvData = result.map(row => row.join(",")).join('\n');
                
                fs.writeFile("./emails.csv", csvData, (err) => {
                    if (err) throw err;
                    console.log("CSV file saved");
                
                });
                

                
                res.json({ result });


            });

    




  } catch (err) {
    
    console.log("Invalid Request");
    console.log(err);
  }
});





app.listen(3000, function()  {
    console.log("Server is running on port 3000");
});
