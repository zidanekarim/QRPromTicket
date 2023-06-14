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
            // Work with JSON data here
            console.log(data);
        

            })
            .catch(error => {
            console.log("error", error);
            // Handle the error, for example, by displaying an error message to the user.
            });
});
});