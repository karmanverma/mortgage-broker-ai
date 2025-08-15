import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useDataConsistency } from '@/hooks/useDataConsistency';

export function DataConsistencyChecker() {
  const {
    isChecking,
    lastCheckResult,
    checkConsistency,
    getIssuesByType,
    getIssueDescription,
    hasIssuesOfType,
  } = useDataConsistency();

  const issueTypes = [
    'orphaned_person',
    'client_without_people',
    'lender_without_people', 
    'realtor_without_people',
    'invalid_client_people',
    'invalid_lender_people',
    'invalid_realtor_people',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {lastCheckResult?.hasIssues ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : lastCheckResult ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : null}
          Data Consistency Checker
        </CardTitle>
        <CardDescription>
          Validate person-entity relationships and detect data inconsistencies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={checkConsistency}
            disabled={isChecking}
            size="sm"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Run Consistency Check'
            )}
          </Button>
          
          {lastCheckResult && (
            <Badge variant={lastCheckResult.hasIssues ? "destructive" : "default"}>
              {lastCheckResult.hasIssues 
                ? `${lastCheckResult.totalIssues} issues found`
                : 'All checks passed'
              }
            </Badge>
          )}
        </div>

        {lastCheckResult && lastCheckResult.hasIssues && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Issues Found:</h4>
            {issueTypes.map(issueType => {
              const issues = getIssuesByType(issueType);
              if (issues.length === 0) return null;

              return (
                <div key={issueType} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {getIssueDescription(issueType)}
                    </span>
                    <Badge variant="outline">
                      {issues.length} issue{issues.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Affected records: {issues.map(issue => issue.record_id).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lastCheckResult && !lastCheckResult.hasIssues && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            All person-entity relationships are consistent
          </div>
        )}
      </CardContent>
    </Card>
  );
}