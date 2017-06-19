var Tours = {
  'input':[
          {          
            element: '.fa.fa-star:visible',            
            title: "Добавление в избранное",
            content: "После добавления документа в избранное, вы сможете быстро выбирать его в левом меню"
          },
          {
            element: '.fa.fa-refresh:visible',
            title: "Обновление данных",
            content: "Для обновления данных не нужно обновлять страницу целиком, а можно нажать на кнопку или клавишу F9"
          }, 
          {
            element: '.fa.fa-expand:visible',
            title: "Отображение строк",
            content: "По умолчанию, текст в строках обрезается, но если включить этот режим то текст будет выводится в несколько строк."
          },          
          {
            element: '.fa.fa-text.fa-comma:visible',
            title: "Выделять дробные значения",
            content: "После включения этого режима, в таблице, при наведении на отмеченные ячейки, будет отображаться полное число вместо округленного."
          },          
          {
            element: '.fa.fa-calendar-minus-o:visible,.fa.fa-calendar-plus-o:visible',
            title: "Контекстно зависимые периоды",
            content: "После выбора периода, здесь будут отображаться периоды, которые, возможно, могут вас заинтересовать"
          },
    ],


  'createOrg': [
    {
      element: '.navbar li.grey a.dropdown-toggle',
      title: "Администрирование системы",
      content: "Нажмите для перехода режим администрирования",
      onHide: function(tour){
        LeftMenu.IsMenuToggled(false);
      }
    },{
      element: '#sidebar-left .nav-list #leftmenu_org',
      title: "Справочник предприятий",
      content: "Нажмите для перехода в справочник предприятий",
    },{
      element: '.toolH #modeladd',
      title: "Добавить новый объект",
      content: "Нажмите, чтобы добавить новую организацию в справочник",
    },{
      element: '.profile-user-info',
      title: "Поля формы",
      content: "Заполните все необходимые поля формы",
      backdrop: true,
      backdropPadding: 10,
    },{
      element: '.toolH #modelsave',
      title: "Сохранить объект",
      content: "Нажмите, чтобы сохранить новую организацию"
    }
  ],
  'createObj': [
    {
      element: '.navbar li.grey a.dropdown-toggle',
      title: "Администрирование системы",
      content: "Нажмите для перехода режим администрирования",
      onHide: function(tour){
        LeftMenu.IsMenuToggled(false);
      }
    },{
      element: '#sidebar-left .nav-list #leftmenu_org',
      title: "Справочник объектов учета",
      content: "Нажмите для перехода в справочник объектов учета",
    },{
      element: '.toolH #modeladd',
      title: "Добавить новый объект",
      content: "Нажмите, чтобы добавить новый объект учета в справочник",
    },{
      element: '.profile-user-info',
      title: "Поля формы",
      content: "Заполните все необходимые поля формы",
      backdrop: true,
      backdropPadding: 10,
    },{
      element: '.toolH #modelsave',
      title: "Сохранить объект",
      content: "Нажмите, чтобы сохранить новый объект учета"
    }
  ],
}



var m_tour = {
    template:'<div class="popover" role="tooltip"> <div class="arrow"></div> <h3 class="popover-title"></h3> <div class="popover-content"></div> <div class="popover-navigation"> <button class="btn btn-sm btn-default" data-role="end">Закрыть</button> </div> </div>',
    tour:null,
    showTour:function(type){
      var Steps = Tours[type];
      // var currentPath = [document.location.pathname, document.location.hash].join('');
      Steps.forEach(function(S){
        // S.path = currentPath;
        S.placement = "bottom";
        S.reflex = true;
        S.redirect = false;
      })
      m_tour.tour = new Tour({
          template:m_tour.template,
          steps:Steps,
          keyboard: false,
          autoscroll: false,
          // debug: true,
          delay: 100,
      });
      m_tour.tour.setCurrentStep(0);
      m_tour.tour.init(true);
      m_tour.tour.start(true);
    }
}

