

    $(".addComment").on("click", function () {
        event.preventDefault();
        // Empty the notes from the note section
        $("#notes").empty();
        // Save the id from the p tag
        var thisId = $(this).attr("data-id");

        // Now make an ajax call for the Article
        $.ajax({
            method: "GET",
            url: "/articles/" + thisId
        })
            // With that done, add the note information to the page
            .then(function (data) {
                console.log(data);
                console.log(data[0].title)
                // The title of the article
                $("#notes").append("<h2>" + data[0].title + "</h2>");
                // An input to enter a new title
                $("#notes").append("<input id='titleinput' name='title' ><br/><br/>");
                // A textarea to add a new note body
                $("#notes").append("<textarea id='bodyinput' name='body'></textarea><br/>");
                // A button to submit a new note, with the id of the article saved to it
                $("#notes").append("<button data-id='" + data[0]._id + "' id='savenote' class='button btn-primary'>Save Comment</button>");

                // If there's a note in the article
                
            });
    });
    $(document).on("click", "#savenote", function () {
        // Grab the id associated with the article from the submit button
        var thisId = $(this).attr("data-id");
        var title = $("#titleinput").val();
        var body = $("#bodyinput").val();
        console.log("this is the title input", title);
        console.log("this is the body input", body);

        // Run a POST request to change the note, using what's entered in the inputs
        $.ajax({
            method: "POST",
            url: "/articles/" + thisId,
            data: {
                // Value taken from title input
                title: $("#titleinput").val(),
                // Value taken from note textarea
                body: $("#bodyinput").val()
            }
        })
            // With that done
            .then(function (data) {
                // Log the response
                console.log(data);
                // Empty the notes section
                $("#notes").empty();
            });

        // Also, remove the values entered in the input and textarea for note entry
        $("#titleinput").val("");
        $("#bodyinput").val("");
    });

    $(".seeComments").on("click", function () {
        var thisId = $(this).attr("data-id");
        window.location.replace(`/comments/${thisId}`)
    });

    $(documtent).on("click", ".goHome", function () {
        // event.preventDefault();

        window.location.replace('/');
    })

