module.exports = {
    models: {
        period: {
            IsNone: {
                type: Boolean,
                default: false,
                extended: true,
                ignoresave: true
            },
            BeginDateText: {
                type: String,
                default: '31-01',
                trim: true,
                template: "form_text",
                mask: '99-99'
            },
            EndDateText: {
                type: String,
                default: '31-01',
                trim: true,
                template: "form_text",
                mask: '99-99'
            },
            Formula: {
                template: "form_period_formula"
            },
            ValutaRateFormula: {
                type: String,
                default: null
            }
        }
    },
    schema: {
        period: function (schema) {
            schema.pre('save', function (next, userBy, done) {
                var rep = function (st) {
                    var sta = st.split("-");
                    return [sta[1], sta[0]].join("-");
                }
                this.BeginDate = new Date("1978-" + rep(this.BeginDateText) + " 12:00:00");
                this.EndDate = new Date("1978-" + rep(this.EndDateText) + " 12:00:00");
                console.log(this.BeginDate, " = ", this.BeginDateText);
                console.log(this.EndDate, " = ", this.EndDateText);
                return next(null, this);
            })
            return schema;
        }
    }
}
