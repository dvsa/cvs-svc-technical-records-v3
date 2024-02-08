# Hotfix for CB2-10791: Remediate the ~1300 TRL Tech Records with a Primary VRM

The issue involves ~1300 tech records being in an invalid state where vehicle type is trl, and a primary vrm
has been set.

Hotfix clears the primary vrm from those invalid records, creates a new record and archives the existing one.

## Considerations

Data remediation app was not setup to update tech records.

We are archiving the existing record because the primary vrm is a GSI, so updating in place would require
dropping and rebuilding the index. This is a more involved deployment and impacts search so was considered a lesser
resolution than archving the existing records.
