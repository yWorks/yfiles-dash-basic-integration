# -*- coding: utf-8 -*-
import dash
import dash_core_components as dcc
import dash_html_components as html
import yfiles_component as yfiles

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']

app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
app.css.config.serve_locally = True
app.scripts.config.serve_locally = True

app.layout = html.Div(
    className='graph-component-container',
    children=[
        yfiles.ExampleComponent(
            layoutMode='Hierarchic',
            data=[{
                    'level': 0,
                    'children': [{
                        'level': 1,
                        'children': [{'level': 2}, {'level': 2}, {'level': 2}, {'level': 2}, {'level': 2}, {'level': 2}]
                        }, {
                        'level': 1,
                        'children': [{'level': 2}, {'level': 2}, {'level': 2}, {'level': 2}]
                        }, {
                        'level': 1,
                        'children': [{
                            'level': 2,
                            'children': [{'level': 3}, {'level': 3}]
                            }, {
                            'level': 2,
                            'children': [{'level': 3}, {'level': 3}]
                        }]
                    }]
                }]
        )
])

if __name__ == '__main__':
    app.run_server(debug=True)