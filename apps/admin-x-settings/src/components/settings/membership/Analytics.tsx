import React, {useEffect, useState} from 'react';
import TopLevelGroup from '../../TopLevelGroup';
import useFeatureFlag from '../../../hooks/useFeatureFlag';
import useSettingGroup from '../../../hooks/useSettingGroup';
import {Button, Separator, SettingGroupContent, Toggle, withErrorBoundary} from '@tryghost/admin-x-design-system';
import {HostLimitError, useLimiter} from '../../../hooks/useLimiter';
import {getSettingValues, isSettingReadOnly} from '@tryghost/admin-x-framework/api/settings';
import {usePostsExports} from '@tryghost/admin-x-framework/api/posts';

const Analytics: React.FC<{ keywords: string[] }> = ({keywords}) => {
    const [canHaveWebAnalytics, setCanHaveWebAnalytics] = useState(true);
    const limiter = useLimiter();
    const {
        localSettings,
        isEditing,
        saveState,
        handleSave,
        handleCancel,
        updateSetting,
        handleEditingChange
    } = useSettingGroup();

    const [trackEmailOpens, trackEmailClicks, trackMemberSources, outboundLinkTagging, webAnalytics] = getSettingValues(localSettings, [
        'email_track_opens', 'email_track_clicks', 'members_track_sources', 'outbound_link_tagging', 'web_analytics'
    ]) as boolean[];

    const hasTrafficAnalytics = useFeatureFlag('trafficAnalytics');
    const isEmailTrackClicksReadOnly = isSettingReadOnly(localSettings, 'email_track_clicks');

    useEffect(() => {
        if (limiter?.isLimited('limitAnalytics')) {
            limiter.errorIfWouldGoOverLimit('limitAnalytics').catch((error) => {
                if (error instanceof HostLimitError) {
                    setCanHaveWebAnalytics(false);
                }
            });
        }
    }, [limiter]);

    const handleToggleChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        updateSetting(key, e.target.checked);
        handleEditingChange(true);
    };

    const {refetch: postsData} = usePostsExports({
        searchParams: {
            limit: '1000'
        },
        enabled: false
    });

    const exportPosts = async () => {
        const {data} = await postsData();
        if (data) {
            const blob = new Blob([data], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `post-analytics.${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const inputs = (
        <SettingGroupContent className="analytics-settings !gap-y-0" columns={1}>
            {hasTrafficAnalytics && canHaveWebAnalytics && (
                <>
                    <Toggle
                        checked={webAnalytics}
                        direction='rtl'
                        gap='gap-0'
                        label='Web analytics'
                        labelClasses='py-4 w-full'
                        onChange={(e) => {
                            handleToggleChange('web_analytics', e);
                        }}
                    />
                    <Separator className="border-grey-200 dark:border-grey-900" />
                </>
            )}
            <Toggle
                checked={trackEmailOpens}
                direction='rtl'
                gap='gap-0'
                label='Newsletter opens'
                labelClasses='py-4 w-full'
                onChange={(e) => {
                    handleToggleChange('email_track_opens', e);
                }}
            />
            <Separator className="border-grey-200 dark:border-grey-900" />
            <Toggle
                checked={trackEmailClicks}
                direction='rtl'
                disabled={isEmailTrackClicksReadOnly}
                gap='gap-0'
                label='Newsletter clicks'
                labelClasses='py-4 w-full'
                onChange={(e) => {
                    handleToggleChange('email_track_clicks', e);
                }}
            />
            <Separator className="border-grey-200 dark:border-grey-900" />
            <Toggle
                checked={trackMemberSources}
                direction='rtl'
                gap='gap-0'
                label='Member sources'
                labelClasses='py-4 w-full'
                onChange={(e) => {
                    handleToggleChange('members_track_sources', e);
                }}
            />
            <Separator className="border-grey-200 dark:border-grey-900" />
            <Toggle
                checked={outboundLinkTagging}
                direction='rtl'
                gap='gap-0'
                label='Outbound link tagging'
                labelClasses='py-4 w-full'
                onChange={(e) => {
                    handleToggleChange('outbound_link_tagging', e);
                }}
            />
        </SettingGroupContent>
    );

    return (
        <TopLevelGroup
            description='Decide what data you collect across your publication'
            isEditing={isEditing}
            keywords={keywords}
            navid='analytics'
            saveState={saveState}
            testId='analytics'
            title='Analytics'
            hideEditButton
            onCancel={handleCancel}
            onEditingChange={handleEditingChange}
            onSave={handleSave}
        >
            {inputs}
            <div className='items-center-mt-1 flex justify-between'>
                <Button color='green' label='Export' link linkWithPadding onClick={exportPosts} />
                <a className='text-sm text-green' href="https://ghost.org/help/post-analytics/" rel="noopener noreferrer" target="_blank">Learn about analytics</a>
            </div>
        </TopLevelGroup>
    );
};

export default withErrorBoundary(Analytics, 'Analytics');
