// NoteDetails.js - Handles note details

const NoteDetails = {
  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    document
      .querySelector(".notes")
      .addEventListener("click", this.loadNoteDetails.bind(this));
  },

  loadNoteDetails: function (event) {
    if (event.target.tagName === "P") {
      const noteId = event.target
        .closest(".note-item")
        .getAttribute("data-note-id");
      const note = DataService.getNoteById(noteId);
      this.displayNoteDetails(note);
    }
  },

  displayNoteDetails: function (note) {
    let noteTitle = document.querySelector(".note-title");
    let noteContent = document.querySelector(".note-content");
    noteTitle.value = note.title;
    noteContent.value = note.content;

    noteTitle.addEventListener("input", function () {
      note.title = noteTitle.value;
      DataService.updateNote(note);
    });

    noteContent.addEventListener("input", function () {
      note.content = noteContent.value;
      DataService.updateNote(note);
    });
  },
};

NoteDetails.init();
