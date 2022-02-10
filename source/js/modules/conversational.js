import {ConversationalForm, EventDispatcher, FlowEvents} from 'conversational-form';

const URL = 'send.php';
const ROBOT_IMAGE = 'img/content/avatar-robot.svg';
const USER_IMAGE = 'img/content/avatar-user.svg';

const InitConversational = function (formName) {
  this._formName = formName;
  this._cfInstance = null;
};

InitConversational.prototype = {
  _getFormInstance() {
    return this._cfInstance;
  },
  startConversational() {
    const conversationalElement = document.querySelector(`[data-conversational="${this._formName}"]`);
    const formElement = conversationalElement.querySelector('form');
    const contextElement = conversationalElement.querySelector(`[data-conversational-context="${this._formName}"]`);

    const getFormInstance = this._getFormInstance.bind(this);

    if (formElement && contextElement) {
      formElement.reset();

      const submitCallback = () => {
        const form = getFormInstance();
        const formData = form.getFormData(false);
        const type = formData.get('type');
        const valueName = type === 'whatsapp' ? 'phone' : type;
        formData.append('contact', formData.get(valueName));

        // eslint-disable-next-line no-undef
        gtag({event: 'sentForm'});
        // eslint-disable-next-line no-undef
        fbq('trackCustom', 'sentForm');

        fetch(URL, {
          method: 'POST',
          body: formData,
        })
          .catch(() => {
            form.addRobotChatResponse('Произошла ошибка при попытке отправить ваши данные. Пожалуйста, попробуйте еще раз позже.');
          });
      };

      const dispatcher = new EventDispatcher();
      const flowUpdateHandler = (evt) => {
        // eslint-disable-next-line no-unused-expressions
        if (evt.detail.step === 6) {
          submitCallback();
          dispatcher.removeEventListener(FlowEvents.FLOW_UPDATE, flowUpdateHandler);
        }
      };
      dispatcher.addEventListener(FlowEvents.FLOW_UPDATE, flowUpdateHandler, false);

      this._cfInstance = ConversationalForm.startTheConversation({
        formEl: formElement,
        context: contextElement,
        robotImage: ROBOT_IMAGE,
        userImage: USER_IMAGE,
        preventAutoFocus: false,
        dictionaryData: {
          'input-placeholder': 'Напишите сообщение...',
          'input-placeholder-required': 'Ввод данных обязателен...',
          'input-placeholder-error': 'Ваши данные не корректны ...',
          'input-no-filter': 'Не найдены результаты для {input-value}',
          'group-placeholder': 'Выберите вариант',
        },
        eventDispatcher: dispatcher,
        submitCallback() {},
      });
    }
  },
  stopConversational() {
    this._cfInstance.stop();
    this._cfInstance.remove();
  },
};

export {InitConversational};