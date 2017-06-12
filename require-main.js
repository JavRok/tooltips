 
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
            'orientation': 'bottom',
            'showOn': 'hover'
        }
    );

    // Input focus
	var reference2 = Tooltip.create(
		document.getElementById('input-text'),
		{
			'orientation': 'right',
			'showOn': 'focus',
            'text': 'You can set any kind of DOM event, including focus, click, keydown, mouseover...'
		}
	);
});
