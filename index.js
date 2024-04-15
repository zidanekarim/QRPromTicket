const dotenv = require("dotenv")
dotenv.config()
const express = require('express');
const app = express();
const fs = require("fs");
const { parse } = require("csv-parse");
const xlsx = require('node-xlsx');
//const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');

const sgAPI = process.env.SG_API;

sgMail.setApiKey(sgAPI);
const QRCode = require('qrcode');
app.use(express.static(__dirname + '/public'));

const dbURI = process.env.DB_URI;

app.get("/", function(req, res)  {
    res.sendFile(__dirname + "/public/index.html");
});
var result = [];





mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log(err);
  });

mongoose.connection.on('open', function (ref) {
  console.log('Connected to mongo server.');
});


const paymentSchema = new mongoose.Schema({
    email: String,
    paid : Boolean,
    code: String,
});

const Payment = mongoose.model("Payment", paymentSchema);




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
      //console.log(typeof(data[17]));
      //console.log("HELLO!!!");
      let emailAndCount = data[15].concat(data[17]);

      result.push([emailAndCount]);
        
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
        let emailAndCount = data[15].concat(data[17]);
        if (!fs.readFileSync("./emails.csv").toString().includes(emailAndCount)) {
            result.push([emailAndCount, ""]);
        }
    })
    .on("end", () => {
                // Append the CSV file
                const csvData = '\n' + result.map(row => row.join(",")).join('\n');
                fs.appendFile("./emails.csv", csvData, (err) => {
                    if (err) throw err;
                    console.log("Email CSV file updated");
                }
                );
                
            });
}





app.post("/run", async (req, res) => {
  try {
    const result = [];

    const stream = fs.createReadStream("./emails.csv").pipe(
      parse({
        delimiter: ",",
        relax_quotes: true,
        skip_empty_lines: true,
      })
    );

    for await (const data of stream) {
      console.log("data: ", data);
      if (data.length > 1 && data[1] === "paid") {
        result.push([data[0], data[1]]);
      } else {
        try {
          // create a random 16 character string for the QR code, use a variety of numbers and letters
          // get last character of email to remove the count
          let count = data[0].substring(data[0].length - 1);
          let countText = "";
          console.log("count: ", count);
          if (count === "1") {
            countText = "ONE";
          }
          else if (count === "2") {
            countText = "TWO";
          }

          var code = Math.random().toString(36).substring(2, 18);
          console.log("code: ", code);
          code = countText.concat(code);

          await new Promise((resolve, reject) => {
            QRCode.toFile('qrcode.png', code, function (err) {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                console.log('QR code saved as qrcode.png');
                resolve();
              }
            });
          });

          const attachment = fs.readFileSync('qrcode.png').toString('base64');
          
          let emailWithoutCount = data[0].substring(0, data[0].length - 1);
          const mailOptions = {
            from: 'zidane.karim@stuysu.org',
            to: emailWithoutCount,
            subject: 'Your QR Code',
            text: "Please find your QR code attached",
            attachments: [
              {
                filename: 'qrcode.png',
                content: attachment,
              },
            ],
          };

          await sgMail.send(mailOptions);

          console.log('Email sent');
          result.push([data[0], "paid"]);

          await Payment.findOneAndUpdate(
          { email: emailWithoutCount },
          { paid: true, code: code },
          { upsert: true }
        );

          console.log('Payment saved successfully.');
        } catch (error) {
          console.error(error);
        }
      }
    }

    console.log("result ", result);

    const csvData = result.map(row => row.join(",")).join('\n');

    fs.writeFile("emails.csv", csvData, (err) => {
      if (err) throw err;
      console.log("CSV file saved");
    });

    console.log("BONKERS ", result);
    res.status(200).json({ result });
  } catch (err) {
    console.log("Invalid Request");
    console.log(err);
  }
});

app.listen(5000, function()  {
    console.log("Server is running on port 5000");
});
