import React from 'react'
import { ProfilePic } from './ProfilePic'
import { MoreSettings } from './icons/MoreIcon'
import { UsernameText } from './UsernameText'
import { useTranslation } from 'react-i18next'

export function FeedItemHeader({ moreClickEvent, username, image }: any) {
  const { t } = useTranslation()
  return (
    <div className="FeedItemHeader pl-4 pr-4 bg-white flex items-center">
      <ProfilePic src={image} size={32} username={username} />
      <UsernameText
        className="FeedItemHeader-text text-14-bold mr-1 ml-4 cursor-pointer"
        username={username || t('social:username')}
      />
      <button type="button" className="ml-auto flex">
        <MoreSettings onClick={moreClickEvent} />
      </button>
    </div>
  )
}
