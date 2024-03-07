# Hotfix for CB2-11175: Add a plate to around 8000 current HGV and TRL records.

We need to make plates avaliable for historical purposes. This requires adding a new plate to a lot of vehicles.
A new lambda makes the most sense as we need to remove the validation and also throttle the number of requests.

## Considerations

Data remediation app was not setup to update tech records.

The side effect of the plate being generated will work with no modifications.