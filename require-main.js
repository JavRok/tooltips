 
require.config({
    paths: {
        // Tooltip: 'tooltip-require'
        Tooltip: 'tooltips'
    }
});

require(['Tooltip'], function(Tooltip) {
    var reference = Tooltip.create(
        document.getElementById('js_example'),
        {
            'orientation': 'right',
            'showOn': 'click'
        }
    );
});
