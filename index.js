const express = require('express');
const app = express();
const fs = require("fs");
const { parse } = require("csv-parse");
const xlsx = require('node-xlsx');
const nodemailer = require('nodemailer');

const QRCode = require('qrcode');
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res)  {
    res.sendFile(__dirname + "/public/index.html");
});
var result = [];

var transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: "zkarim7676@hotmail.com",
    pass: " "
  }
});



const workSheetsFromFile = xlsx.parse(`${__dirname}/payments.xlsx`);
const rowsToExclude = 1;
const csvData = workSheetsFromFile[0].data
    .slice(rowsToExclude) // Exclude the first two rows
    .map(row => {
        const cleanedRow = row.map(cell => {
            if (typeof cell === "string") {
                return cell.trim(); // Remove leading/trailing spaces
            }
            return cell;
        });
        return cleanedRow.join(",");
    })
    .join('\n');

fs.writeFile("./payments.csv", csvData, (err) => {
    if (err) throw err;
    console.log("Payment CSV file saved");
});





// fill emails.csv with the email from payments.csv, ignoring the first row
if (!fs.existsSync("./emails.csv")) {
    console.log("Emails CSV file does not exist, creating emails.csv");
    fs.createReadStream("./payments.csv")
    .pipe(parse(
        {
            delimiter: ",",
            relax_quotes: true,
            skip_empty_lines: true,
        }
    ))
    .on("data", (data) => {
        result.push([data[15]]);
        
    })
    .on("end", () => {
                // Overwrite the CSV file
                const csvData = result.map(row => row.join(",")).join('\n');
                fs.writeFile("./emails.csv", csvData, (err) => {
                    if (err) throw err;
                    console.log("Email CSV file saved");
                });
            });
    }

// if it does exist, do the same thing but skip values that are already in emails.csv (specifically, data[15]  )
else {
    console.log("Emails CSV file exists, updating emails.csv");
    fs.createReadStream("./payments.csv")
    .pipe(parse(
        {
            delimiter: ",",
            relax_quotes: true,
            skip_empty_lines: true,
        }
    ))
    .on("data", (data) => {
        if (!fs.readFileSync("./emails.csv").toString().includes(data[15])) {
            result.push([data[15]]);
        }
    })
    .on("end", () => {
                // Append the CSV file
                const csvData = result.map(row => row.join(",")).join('\n') + '\n';
                fs.appendFile("./emails.csv", csvData, (err) => {
                    if (err) throw err;
                    console.log("Email CSV file updated");
                }
                );
                
            });
}





app.post("/run", async (req, res) => {
  result = []; 

  try {

    fs.createReadStream("./emails.csv")
    .pipe(parse(
        {
            delimiter: ",",
            relax_quotes: true,
            skip_empty_lines: true,
        }
    ))
    .on("data", (data) => {
            console.log("data: ", data);
            if (data.length > 1) {
                result.push([data[0], data[1]]);
            }
            else {
               // save data[0] as a QR code png and send it to data[0]
                QRCode.toFile('./qrcode.png', data[0], function (err) {
                    if (err) throw err;
                    console.log('QR code saved as qrcode.png');

                const qrCodeData = fs.readFileSync('./qrcode.png');
                const mailOptions = {
                    from: 'zkarim7676@hotmail.com',
                    to: data[0],
                    subject: 'Your QR Code',
                    text: "Please find your QR code attached",
                    attachments: [
                        {
                            filename: 'qrcode.png',
                            content: qrCodeData,
                        },
                        ],
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        fs.unlinkSync('./qrcode.png');
                    }
                });
                
                    result.push([data[0], "paid"]);
                    });
            }
        
    })
    .on("end", () => {
               // console.log("result "+ result);

                // Overwrite the CSV file
                const csvData = result.map(row => row.join(",")).join('\n');
                
                fs.writeFile("./emails.csv", csvData, (err) => {
                    if (err) throw err;
                    console.log("CSV file saved");
                
                });
                

                console.log("BONKERS "+ result);
                res.status(200).json({ result });
                


            });

    


            

  } catch (err) {
    
    console.log("Invalid Request");
    console.log(err);
  }
  
});





app.listen(5000, function()  {
    console.log("Server is running on port 5000");
});
