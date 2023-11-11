import json
import plotly.graph_objects as go

with open('./performance_metrics.json', 'r') as f:
  performance_dict = json.load(f)

summary_dict = {}

for k, v in performance_dict.items():
    if v[1] > 0: # remove those that have EWT less than expected
        summary_dict[k] = (v[0] - v[1]) / v[0]

# Prepare data for plotting
num_trips, num_stops, percentage_decrease = [], [], []

for key, value in summary_dict.items():
    trips, stops = map(int, key.split(','))
    num_trips.append(trips)
    num_stops.append(stops)
    percentage_decrease.append(value)

print(f"Average decrease in Excess Wait Time: {sum(percentage_decrease) / len(percentage_decrease)}")

# Create 3D scatter plot
fig = go.Figure(data=[go.Scatter3d(
    x=num_trips,
    y=num_stops,
    z=percentage_decrease,
    mode='markers',
    marker=dict(
        size=5,
        color=percentage_decrease,
        colorscale='Viridis',
        opacity=0.8
    )
)])

# Set plot layout
fig.update_layout(
    title='3D Scatter Plot of Percentage Decrease in Excess Wait Time',
    scene=dict(
        xaxis_title='Number of Trips',
        yaxis_title='Number of Stops',
        zaxis_title='Percentage Decrease in EWT'
    )
)

# Display the plot
fig.show()