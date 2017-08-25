module.exports = {
    models: {
        valutarate: {
            Value: {
                mask: "0.00000"
            },
            Value1: {
                mask: "0.00000"
            },
            Value2: {
                mask: "0.00000"
            }
        },
        valuta: {
            CBRCode: {
                type: String,
                default: null,
                extended: true,
                ignoresave: true
            }
        }
    },
    schema: {

    }
}
