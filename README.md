# QRPromTicket

A simple web app designed to process data from an Excel file and . This was developed in mind of creating tickets for Stuyvesant High School's Senior Prom

## Installation

Clone the repository and start the server with node. 

```bash
git@github.com:ThePotatoPowers/QRPromTicket.git
node index.js
```

## Usage

Add your database in an `.env` file. This app uses MongoDB. You will also need to enter a sendgrid API key

The format for the database is `{email, paid, code}`. You create the `code` from the QR code and add it to the database. 
You must replace the payments.xlsx file with your own. Everything else will be auto-generated for you. 

The index webpage of this website serves no functionality other than to run the email send. Once an email is sent, the same person will not be
emailed again unless all the CSV files are deleted. 


This website is meant to be locally hosted. You can work with a hosting service, although you will have to implement some additional code to load
the CSV + XLS files properly. 


Look into [the other part of this project](https://github.com/ThePotatoPowers/QRTest) for instructions on how to scan these codes.  

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[ISC](https://opensource.org/license/isc-license-txt/)

## Dependencies

- csv-parse
- dotenv
- express
- mongoose
- node-xlsx
- @sendgrid-mail
- fs
- qrcode