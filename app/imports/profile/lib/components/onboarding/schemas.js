Schemas = {};

Schemas.expertInformation = new SimpleSchema({
  price: {
    type: Number,
    label: "Appointment's price",
    decimal: true,
    // optional: true,
  }
});
