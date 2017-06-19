module.exports = {
    models: {
        "chart": {
            DrawNull: {
                type: Boolean,
                default: false,
            },
            AreaSpline: {
                type: Boolean,
                default: false,
            },
            RadarColors: {
                type: String,
                default: '',
            }
        },
        "rowchartline": {
            RowType: {
                type: String,
                default: "bar",
            },
            Dotted: {
                type: Boolean,
                default: false,
            },
            SBIndex: {
                type: Number,
                default: 1,
            },
            AxisIndex: {
                type: Number,
                default: 1,
            },
        }
    },
    schema: {}
}
