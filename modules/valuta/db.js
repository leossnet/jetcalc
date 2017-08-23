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
            },
            IsFormula: {
                type: Boolean,
                default: false
            },
            Formula: {
                type: String,
                default: null
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
