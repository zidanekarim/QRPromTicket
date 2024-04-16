document.addEventListener("DOMContentLoaded", function() {
    // Wait for the DOM to load

    const button = document.getElementById("myButton");

    button.addEventListener("click", function() {
        console.log("button clicked");
        fetch('/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Referrer-Policy': 'no-referrer-when-downgrade'},
            body: JSON.stringify({ })
            })
            .then(response => {
            if(!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
            })
            .then(data => {

            // Assuming you have a table element with the id "qrTable"
            var table = document.getElementById("qrTable");

            // Reset the table by removing all existing rows
            while (table.rows.length > 0) {
                table.deleteRow(0);
            }

            console.log(data.result);

            // Work with JSON data here
            for (var i = 0; i < data.result.length; i++) {
                var email = data.result[i][0];
                var qr = data.result[i][1];

                // Create a new row
                var newRow = table.insertRow();

                // Insert cells for email and QR code
                var emailCell = newRow.insertCell();
                var qrCell = newRow.insertCell();

                // Assign values to the cells
                emailCell.innerHTML = email;
                qrCell.innerHTML = qr;
            }
            })
            .catch(error => {
            console.log("error", error);
            // Handle the error, for example, by displaying an error message to the user.
        });
    });
});