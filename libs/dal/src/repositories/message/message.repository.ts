import { ChannelTypeEnum } from '@novu/shared';
import { SoftDeleteModel } from 'mongoose-delete';
import { FilterQuery, Types } from 'mongoose';
import { BaseRepository } from '../base-repository';
import { MessageEntity } from './message.entity';
import { Message } from './message.schema';
import { NotificationTemplateEntity } from '../notification-template';
import { FeedRepository } from '../feed';
import { DalException } from '../../shared';

export class MessageRepository extends BaseRepository<MessageEntity> {
  private message: SoftDeleteModel;
  private feedRepository = new FeedRepository();
  constructor() {
    super(Message, MessageEntity);
    this.message = Message;
  }

  private async getFilterQueryForMessage(
    environmentId: string,
    subscriberId: string,
    channel: ChannelTypeEnum,
    query: { feedId?: string[]; seen?: boolean }
  ): Promise<FilterQuery<MessageEntity>> {
    const requestQuery: FilterQuery<MessageEntity> = {
      _environmentId: environmentId,
      _subscriberId: subscriberId,
      channel,
    };

    if (query.feedId === null) {
      requestQuery._feedId = { $eq: null };
    }

    if (query.feedId) {
      const feeds = await this.feedRepository.find(
        {
          _environmentId: environmentId,
          identifier: {
            $in: query.feedId,
          },
        },
        '_id'
      );
      requestQuery._feedId = {
        $in: feeds.map((feed) => feed._id),
      };
    }

    if (query.seen != null) {
      requestQuery.seen = query.seen;
    }

    return requestQuery;
  }

  async findBySubscriberChannel(
    environmentId: string,
    subscriberId: string,
    channel: ChannelTypeEnum,
    query: { feedId?: string[]; seen?: boolean } = {},
    options: { limit: number; skip?: number } = { limit: 10 }
  ) {
    const requestQuery = await this.getFilterQueryForMessage(environmentId, subscriberId, channel, query);
    const messages = await this.find(requestQuery, '', {
      limit: options.limit,
      skip: options.skip,
      sort: '-createdAt',
    });

    return messages;
  }

  async getTotalCount(
    environmentId: string,
    subscriberId: string,
    channel: ChannelTypeEnum,
    query: { feedId?: string[]; seen?: boolean } = {}
  ) {
    const requestQuery = await this.getFilterQueryForMessage(environmentId, subscriberId, channel, query);

    return await this.count(requestQuery);
  }

  async getUnseenCount(
    environmentId: string,
    subscriberId: string,
    channel: ChannelTypeEnum,
    query: { feedId?: string[]; seen?: boolean } = {}
  ) {
    const requestQuery = await this.getFilterQueryForMessage(environmentId, subscriberId, channel, {
      feedId: query.feedId,
      seen: false,
    });

    return await this.count(requestQuery);
  }

  async changeSeenStatus(subscriberId: string, messageId: string, isSeen: boolean) {
    return this.update(
      {
        _subscriberId: subscriberId,
        _id: messageId,
      },
      {
        $set: {
          seen: isSeen,
          lastSeenDate: new Date(),
        },
      }
    );
  }

  async updateFeedByMessageTemplateId(messageId: string, feedId: string) {
    return this.update(
      {
        _messageTemplateId: messageId,
      },
      {
        $set: {
          _feedId: feedId,
        },
      }
    );
  }

  async getBulkMessagesByNotificationIds(environmentId: string, notificationIds: string[]) {
    return this.find({
      _environmentId: environmentId,
      _notificationId: {
        $in: notificationIds,
      },
    });
  }

  async updateMessageStatus(
    id: string,
    status: 'error' | 'sent' | 'warning',
    // eslint-disable-next-line
    providerPayload: any = {},
    errorId: string,
    errorText: string
  ) {
    return await this.update(
      {
        _id: id,
      },
      {
        $set: {
          status,
          errorId,
          errorText,
          providerPayload,
        },
      }
    );
  }
  async getActivityGraphStats(date: Date, environmentId: string) {
    return await this.aggregate([
      {
        $match: {
          createdAt: { $gte: date },
          _environmentId: new Types.ObjectId(environmentId),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: {
            $sum: 1,
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }

  async getFeed(
    environmentId: string,
    query: { channels?: ChannelTypeEnum[]; templates?: string[]; emails?: string[]; subscriberId?: string } = {},
    skip = 0,
    limit = 10
  ) {
    const requestQuery: FilterQuery<NotificationTemplateEntity> = {
      _environmentId: environmentId,
    };

    if (query?.channels) {
      requestQuery.channel = {
        $in: query.channels,
      };
    }

    if (query?.templates) {
      requestQuery._templateId = {
        $in: query.templates,
      };
    }

    if (query?.emails) {
      requestQuery.email = {
        $in: query.emails,
      };
    }

    if (query?.subscriberId) {
      requestQuery._subscriberId = query?.subscriberId;
    }

    const totalCount = await this.count(requestQuery);
    const response = await Message.find(requestQuery)
      .populate('subscriber', 'firstName _id lastName email')
      .populate('template', 'name _id')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    return {
      totalCount,
      data: this.mapEntities(response),
    };
  }

  async delete(query: FilterQuery<MessageEntity & Document>) {
    const message = await this.findOne({ _id: query._id });
    if (!message) {
      throw new DalException(`Could not find a message with id ${query._id}`);
    }
    await this.message.delete({ _id: message._id, _environmentId: message._environmentId });
  }

  async findDeleted(query: FilterQuery<MessageEntity & Document>): Promise<MessageEntity> {
    const res = await this.message.findDeleted(query);

    return this.mapEntity(res);
  }
}
